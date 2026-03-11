import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';
import { createImageTo3D, getImageTo3DTask, HELLONOID_MESHY_DEFAULTS } from '@/lib/meshy';

// POST: Start or check Meshy 3D generation
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const supabase = getSupabase();
    const { pipeline_id, action, task_id } = await req.json();

    if (!pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id krävs' }, { status: 400 });
    }

    // Get pipeline
    const { data: pipeline } = await supabase
      .from('robot_pipeline')
      .select('*, robots(name, slug)')
      .eq('id', pipeline_id)
      .single();

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline hittades inte' }, { status: 404 });
    }

    // Check generation limit
    if (pipeline.meshy_generations >= pipeline.max_generations && action !== 'status') {
      return NextResponse.json({
        error: `Max antal genereringar nått (${pipeline.max_generations}). Öka gränsen i pipeline-inställningar.`
      }, { status: 400 });
    }

    if (action === 'status' && task_id) {
      // Check status of existing task
      try {
        const task = await getImageTo3DTask(task_id);
        return NextResponse.json(task);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    if (action === 'create') {
      // Get the best front-view image to use
      const { data: frontView } = await supabase
        .from('pipeline_media')
        .select('file_url')
        .eq('pipeline_id', pipeline_id)
        .in('media_type', ['rigged_view', 'upscaled', 'cropped', 'reference'])
        .eq('validation_status', 'approved')
        .eq('view_angle', 'front')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fallback to any approved image
      const { data: anyImage } = !frontView ? await supabase
        .from('pipeline_media')
        .select('file_url')
        .eq('pipeline_id', pipeline_id)
        .in('media_type', ['rigged_view', 'upscaled', 'cropped', 'reference'])
        .eq('validation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single() : { data: null };

      const imageUrl = frontView?.file_url || anyImage?.file_url;
      if (!imageUrl) {
        return NextResponse.json({ error: 'Ingen godkänd bild att använda. Godkänn referensbilder eller riggade vyer först.' }, { status: 400 });
      }

      try {
        const result = await createImageTo3D({
          image_url: imageUrl,
          ...HELLONOID_MESHY_DEFAULTS,
          texture_prompt: `High quality texture for ${pipeline.robots?.name || 'humanoid robot'}. Clean, professional materials with metallic and matte surfaces.`,
        });

        // Update pipeline with generation count
        await supabase.from('robot_pipeline').update({
          meshy_generations: pipeline.meshy_generations + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', pipeline_id);

        // Log the action
        await supabase.from('pipeline_step_log').insert({
          pipeline_id,
          step: '11_3d_modeling',
          action: 'enter',
          comment: `Meshy-uppgift skapad: ${result.result}. Bild: ${imageUrl}`,
          performed_by: user.email,
        });

        return NextResponse.json({ task_id: result.result, image_url: imageUrl });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    if (action === 'download' && task_id) {
      // Download completed 3D model and save to storage
      try {
        const task = await getImageTo3DTask(task_id);

        if (task.status !== 'SUCCEEDED') {
          return NextResponse.json({ error: `Uppgiften är inte klar ännu. Status: ${task.status}` }, { status: 400 });
        }

        const glbUrl = task.model_urls?.glb;
        if (!glbUrl) {
          return NextResponse.json({ error: 'Ingen GLB-fil tillgänglig' }, { status: 400 });
        }

        // Download GLB
        const glbRes = await fetch(glbUrl);
        const glbBuffer = Buffer.from(await glbRes.arrayBuffer());

        // Upload to Supabase Storage
        const slug = pipeline.robots?.slug || `robot-${pipeline.robot_id}`;
        const fileName = `${slug}_meshy_v${pipeline.version}_g${pipeline.meshy_generations}.glb`;
        const storagePath = `${slug}/v${pipeline.version}/3d_model/${fileName}`;

        await supabase.storage.from('pipeline').upload(storagePath, glbBuffer, {
          contentType: 'model/gltf-binary',
          upsert: true,
        });

        const { data: urlData } = supabase.storage.from('pipeline').getPublicUrl(storagePath);

        // Save to pipeline_media
        const { data: media } = await supabase
          .from('pipeline_media')
          .insert({
            pipeline_id,
            file_url: urlData.publicUrl,
            file_name: fileName,
            file_size: glbBuffer.length,
            mime_type: 'model/gltf-binary',
            storage_backend: 'r2',
            media_type: '3d_model',
          })
          .select()
          .single();

        // Update credits used
        await supabase.from('robot_pipeline').update({
          meshy_credits_used: (pipeline.meshy_credits_used || 0) + (task.credits_used || 30),
          updated_at: new Date().toISOString(),
        }).eq('id', pipeline_id);

        // Log
        await supabase.from('pipeline_step_log').insert({
          pipeline_id,
          step: '11_3d_modeling',
          action: 'auto_complete',
          comment: `3D-modell nedladdad: ${fileName} (${(glbBuffer.length / 1024 / 1024).toFixed(1)} MB, ${task.credits_used || '~30'} credits)`,
          performed_by: user.email,
        });

        return NextResponse.json({ success: true, media, credits_used: task.credits_used });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Ogiltig action. Använd create, status eller download.' }, { status: 400 });

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Meshy error:', error);
    return NextResponse.json({
      error: `Meshy operation failed: ${error.message}`,
    }, { status: 500 });
  }
}
