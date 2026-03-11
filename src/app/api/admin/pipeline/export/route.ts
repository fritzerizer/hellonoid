import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

/**
 * Export pipeline — Steg 17
 * Skapar proportionella bilder med vattenstämpel för webben.
 *
 * Proportionell storlek:
 * Referenshöjd = 180cm → fyller hela bildhöjden.
 * En robot på 150cm tar upp 150/180 = 83% av bildhöjden.
 *
 * Vyer att exportera: front, left, three_quarter_front
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const supabase = getSupabase();
    const { pipeline_id } = await req.json();

    if (!pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id krävs' }, { status: 400 });
    }

    // Hämta pipeline + robot
    const { data: pipeline } = await supabase
      .from('robot_pipeline')
      .select('*, robots(id, name, slug)')
      .eq('id', pipeline_id)
      .single();

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline hittades inte' }, { status: 404 });
    }

    // Hämta exportkonfigurationer
    const { data: configs } = await supabase
      .from('pipeline_export_config')
      .select('*')
      .order('width');

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Inga exportkonfigurationer definierade' }, { status: 400 });
    }

    // Hämta godkända Blender-renderingar eller riggade vyer
    const { data: sourceMedia } = await supabase
      .from('pipeline_media')
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .in('media_type', ['export', 'rigged_view', 'upscaled'])
      .eq('validation_status', 'approved')
      .in('view_angle', ['front', 'left', 'three_quarter_front']);

    if (!sourceMedia || sourceMedia.length === 0) {
      return NextResponse.json({
        error: 'Inga godkända bilder att exportera. Godkänn riggade vyer eller Blender-renderingar först.'
      }, { status: 400 });
    }

    // Beräkna proportionell skalning
    const REFERENCE_HEIGHT_CM = 180; // Standard humanoid höjd
    const robotHeightCm = pipeline.height_cm || REFERENCE_HEIGHT_CM;
    const heightRatio = robotHeightCm / REFERENCE_HEIGHT_CM;
    const heightConfirmed = pipeline.height_confirmed;

    const results = [];
    const slug = pipeline.robots?.slug || `robot-${pipeline.robot_id}`;

    for (const source of sourceMedia) {
      for (const config of configs) {
        // Beräkna proportionell bildstorlek
        // Roboten tar upp heightRatio av den totala bildhöjden
        const robotPixelHeight = Math.round(config.height * heightRatio);

        const exportInfo = {
          source_file: source.file_name,
          view_angle: source.view_angle,
          config_name: config.name,
          format: config.format,
          target_width: config.width,
          target_height: config.height,
          robot_pixel_height: robotPixelHeight,
          height_ratio: heightRatio,
          height_confirmed: heightConfirmed,
          watermark: config.watermark,
          transparent: config.transparent_bg,
        };

        // Spara export-metadata (själva bildprocessningen sker i Blender/script)
        const fileName = `${slug}_${source.view_angle}_${config.name}.${config.format}`;
        const storagePath = `${slug}/v${pipeline.version}/export/${fileName}`;

        const { data: media } = await supabase
          .from('pipeline_media')
          .insert({
            pipeline_id,
            file_url: `pending:${storagePath}`, // Markera som väntande
            file_name: fileName,
            mime_type: `image/${config.format}`,
            storage_backend: 'r2',
            media_type: 'export',
            view_angle: source.view_angle,
            width: config.width,
            height: config.height,
            validation_status: 'pending',
            validation_comment: JSON.stringify(exportInfo),
          })
          .select()
          .single();

        results.push({ ...exportInfo, media_id: media?.id });
      }
    }

    // Logga
    await supabase.from('pipeline_step_log').insert({
      pipeline_id,
      step: '17_export_web',
      action: 'enter',
      comment: `${results.length} exporter planerade (${sourceMedia.length} vyer × ${configs.length} storlekar). Höjd: ${robotHeightCm}cm (${heightConfirmed ? 'bekräftad' : 'obekräftad'}). Proportionell ratio: ${(heightRatio * 100).toFixed(0)}%.`,
      performed_by: user.email,
    });

    return NextResponse.json({
      exports_planned: results.length,
      height_cm: robotHeightCm,
      height_confirmed: heightConfirmed,
      height_ratio: heightRatio,
      results,
    });

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Export error:', error);
    return NextResponse.json({
      error: `Export failed: ${error.message}`,
    }, { status: 500 });
  }
}
