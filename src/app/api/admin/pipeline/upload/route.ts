import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, 'agent');
    const supabase = getSupabase();

    const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const pipelineId = formData.get('pipeline_id') as string;
  const mediaType = (formData.get('media_type') as string) || 'reference';
  const viewAngle = formData.get('view_angle') as string | null;

  if (!file || !pipelineId) {
    return NextResponse.json({ error: 'file and pipeline_id required' }, { status: 400 });
  }

  // Get pipeline info for folder structure
  const { data: pipeline } = await supabase
    .from('robot_pipeline')
    .select('robot_id, version, robots(slug)')
    .eq('id', parseInt(pipelineId))
    .single();

  if (!pipeline) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  const slug = (pipeline.robots as any)?.slug || `robot-${pipeline.robot_id}`;
  const storagePath = `${slug}/v${pipeline.version}/${mediaType}/${file.name}`;

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('pipeline')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('pipeline').getPublicUrl(storagePath);

  // Get image dimensions if possible
  let width = null;
  let height = null;

  // Record in pipeline_media
  const { data: media, error: dbError } = await supabase
    .from('pipeline_media')
    .insert({
      pipeline_id: parseInt(pipelineId),
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_backend: 'r2',
      media_type: mediaType,
      view_angle: viewAngle || null,
      width,
      height,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

    return NextResponse.json(media);

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: `Upload failed: ${error.message}` 
    }, { status: 500 });
  }
}
