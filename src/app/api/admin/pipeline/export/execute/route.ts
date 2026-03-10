import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';
import { resizeWithWatermark } from '@/lib/watermark';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * POST /api/admin/pipeline/export/execute
 * Execute the actual export process using Blender + watermarking
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const { pipeline_id, force_regenerate = false } = await req.json();

    if (!pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get pipeline + robot info
    const { data: pipeline } = await supabase
      .from('robot_pipeline')
      .select('*, robots(id, name, slug)')
      .eq('id', pipeline_id)
      .single();

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Get 3D model to export from
    const { data: modelMedia } = await supabase
      .from('pipeline_media')
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .eq('media_type', '3d_model')
      .eq('validation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!modelMedia) {
      return NextResponse.json({ 
        error: 'No approved 3D model found. Complete 3D modeling step first.' 
      }, { status: 400 });
    }

    // Get export configs
    const { data: configs } = await supabase
      .from('pipeline_export_config')
      .select('*')
      .order('width');

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No export configurations defined' }, { status: 400 });
    }

    const slug = pipeline.robots?.slug || `robot-${pipeline.robot_id}`;
    const heightCm = pipeline.height_cm || 170;
    const workingDir = `/tmp/hellonoid-export-${pipeline_id}-${Date.now()}`;
    
    try {
      await mkdir(workingDir, { recursive: true });

      // Download the GLB model
      const modelPath = join(workingDir, 'model.glb');
      const modelRes = await fetch(modelMedia.file_url);
      if (!modelRes.ok) {
        throw new Error(`Failed to download model: ${modelRes.statusText}`);
      }
      const modelBuffer = await modelRes.arrayBuffer();
      await writeFile(modelPath, Buffer.from(modelBuffer));

      // Run Blender export
      const outputDir = join(workingDir, 'renders');
      const blenderScript = '/Users/julia/apps/hellonoid/scripts/blender-export.py';

      const blenderCmd = [
        'blender',
        '--background',
        '--python', blenderScript,
        '--',
        '--glb', modelPath,
        '--output-dir', outputDir,
        '--height-cm', heightCm.toString(),
        '--slug', slug
      ].join(' ');

      console.log('Running Blender export:', blenderCmd);
      
      const { stdout, stderr } = await execAsync(blenderCmd, { 
        timeout: 300000, // 5 minutes max
        env: { ...process.env, PATH: '/opt/homebrew/bin:' + process.env.PATH }
      });

      if (stderr && !stderr.includes('Info:')) {
        console.warn('Blender stderr:', stderr);
      }

      console.log('Blender output:', stdout);

      // Process and upload the rendered images
      const results = [];
      const views = ['front', 'left', 'three_quarter_front'];

      for (const view of views) {
        for (const config of configs) {
          const filename = `${slug}_${view}_${config.name}.png`;
          const renderPath = join(outputDir, filename);

          try {
            const renderBuffer = await readFile(renderPath);

            // Add watermark if configured
            let finalBuffer: Buffer = renderBuffer;
            if (config.watermark) {
              finalBuffer = await resizeWithWatermark(
                Buffer.from(renderBuffer),
                config.width,
                config.height,
                {
                  text: 'hellonoid.com',
                  position: 'bottom-right',
                  opacity: 0.6,
                  fontSize: Math.max(14, config.width / 40)
                }
              );
            }

            // Upload to storage
            const storagePath = `${slug}/v${pipeline.version}/export/${filename}`;
            const { error: uploadError } = await supabase.storage
              .from('pipeline')
              .upload(storagePath, finalBuffer, {
                contentType: 'image/png',
                upsert: true,
              });

            if (uploadError) {
              throw uploadError;
            }

            const { data: urlData } = supabase.storage
              .from('pipeline')
              .getPublicUrl(storagePath);

            // Save to pipeline_media
            const { data: media } = await supabase
              .from('pipeline_media')
              .insert({
                pipeline_id,
                file_url: urlData.publicUrl,
                file_name: filename,
                file_size: finalBuffer.length,
                mime_type: 'image/png',
                storage_backend: 'vercel',
                media_type: 'export',
                view_angle: view,
                width: config.width,
                height: config.height,
                validation_status: 'approved',
                validation_comment: `Auto-generated from 3D model. Height: ${heightCm}cm. ${config.watermark ? 'Watermarked.' : 'No watermark.'}`,
                validated_by: user.email,
              })
              .select()
              .single();

            results.push({
              view,
              config: config.name,
              success: true,
              media,
              file_size: finalBuffer.length
            });

          } catch (err: any) {
            results.push({
              view,
              config: config.name,
              success: false,
              error: err.message
            });
          }
        }
      }

      // Log the step completion
      const successCount = results.filter(r => r.success).length;
      await supabase.from('pipeline_step_log').insert({
        pipeline_id,
        step: '17_export_web',
        action: 'complete',
        comment: `Exported ${successCount}/${results.length} images. Height: ${heightCm}cm. Watermark: ${configs.some(c => c.watermark) ? 'enabled' : 'disabled'}.`,
        performed_by: user.email,
      });

      return NextResponse.json({
        success: true,
        exported: successCount,
        total: results.length,
        height_cm: heightCm,
        results
      });

    } finally {
      // Cleanup working directory
      try {
        await execAsync(`rm -rf "${workingDir}"`);
      } catch {
        // Ignore cleanup errors
      }
    }

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Export execution error:', error);
    return NextResponse.json({ 
      error: `Export failed: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}