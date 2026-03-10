import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { homedir } from 'os';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    try { key = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim(); } catch {}
  }
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
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
      storage_backend: 'vercel',  // Using Supabase storage for now
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
}
