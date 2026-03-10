import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { homedir } from 'os';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Use service role for admin operations
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    try { key = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim(); } catch {}
  }
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// POST: Add robot to pipeline
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { robot_id } = await req.json();

  if (!robot_id) {
    return NextResponse.json({ error: 'robot_id required' }, { status: 400 });
  }

  // Check if already in pipeline
  const { data: existing } = await supabase
    .from('robot_pipeline')
    .select('id')
    .eq('robot_id', robot_id)
    .eq('status', 'active')
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Robot already has an active pipeline' }, { status: 409 });
  }

  // Get current max version for this robot
  const { data: versions } = await supabase
    .from('robot_pipeline')
    .select('version')
    .eq('robot_id', robot_id)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version ?? 0) + 1;

  // Get robot height from specs
  const { data: heightSpec } = await supabase
    .from('robot_specs')
    .select('spec_value')
    .eq('robot_id', robot_id)
    .eq('spec_key', 'Height')
    .single();

  const heightCm = heightSpec ? parseFloat(heightSpec.spec_value) : null;

  // Create pipeline entry
  const { data, error } = await supabase
    .from('robot_pipeline')
    .insert({
      robot_id,
      version: nextVersion,
      current_step: '06_collect_media',  // Skip steps 1-5 for existing robots
      height_cm: heightCm,
      height_confirmed: !!heightCm,
      started_by: 'admin',
    })
    .select('*, robots(name, slug, status)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the step entry
  await supabase.from('pipeline_step_log').insert({
    pipeline_id: data.id,
    step: '06_collect_media',
    action: 'enter',
    performed_by: 'admin',
    comment: `Pipeline v${nextVersion} started for existing robot`,
  });

  return NextResponse.json(data);
}

// GET: List pipeline entries
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('robot_pipeline')
    .select('*, robots(name, slug, status)')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
