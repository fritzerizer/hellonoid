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
  const { media_id, status, comment } = await req.json();

  if (!media_id || !status) {
    return NextResponse.json({ error: 'media_id and status required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pipeline_media')
    .update({
      validation_status: status,
      validation_comment: comment || null,
      validated_by: 'admin',
    })
    .eq('id', media_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
