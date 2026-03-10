import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

const STEPS_ORDER = [
  '01_research', '02_duplicate_check', '03_create_robot', '04_create_storage',
  '05_create_subfolders', '06_collect_media', '07_validate_media', '08_generate_views',
  '09_validate_views', '10_upscale_views', '11_3d_modeling', '12_validate_3d',
  '13_import_blender', '14_auto_cleanup', '15_manual_adjustments', '16_validate_result',
  '17_export_web', '18_upload', '19_ready_to_publish',
];

export async function POST(req: NextRequest) {
  try {
    // TODO: Re-enable auth after frontend integration
    // const user = await requireAuth(req, 'agent');
    const user = { email: 'admin' }; // Temporary
    const supabase = getSupabase();
    const { pipeline_id, action, comment, target_step } = await req.json();

  if (!pipeline_id || !action) {
    return NextResponse.json({ error: 'pipeline_id and action required' }, { status: 400 });
  }

  // Get current pipeline
  const { data: pipeline, error: fetchError } = await supabase
    .from('robot_pipeline')
    .select('*')
    .eq('id', pipeline_id)
    .single();

  if (fetchError || !pipeline) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  let newStep: string;
  let newStatus = pipeline.status;

  if (action === 'approve') {
    // Move to next step
    const currentIdx = STEPS_ORDER.indexOf(pipeline.current_step);
    if (currentIdx >= STEPS_ORDER.length - 1) {
      // Already at last step — mark completed
      newStep = pipeline.current_step;
      newStatus = 'completed';
    } else {
      newStep = STEPS_ORDER[currentIdx + 1];
    }
  } else if (action === 'reject') {
    // Send back to specified step (default: collect_media)
    newStep = target_step || '06_collect_media';
    if (!STEPS_ORDER.includes(newStep)) {
      return NextResponse.json({ error: 'Invalid target_step' }, { status: 400 });
    }
  } else if (action === 'skip') {
    // Skip current step
    const currentIdx = STEPS_ORDER.indexOf(pipeline.current_step);
    newStep = currentIdx < STEPS_ORDER.length - 1 ? STEPS_ORDER[currentIdx + 1] : pipeline.current_step;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

    // Log the action
    await supabase.from('pipeline_step_log').insert({
      pipeline_id,
      step: pipeline.current_step,
      action,
      comment: comment || null,
      performed_by: user.email,
    });

  // Update pipeline
  const { data: updated, error: updateError } = await supabase
    .from('robot_pipeline')
    .update({
      current_step: newStep,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pipeline_id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

    // If entering new step, log it
    if (newStep !== pipeline.current_step) {
      await supabase.from('pipeline_step_log').insert({
        pipeline_id,
        step: newStep,
        action: 'enter',
        performed_by: user.email,
      });
    }

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error('Pipeline advance error:', error);
    return NextResponse.json({ 
      error: `Failed to advance pipeline: ${error.message}` 
    }, { status: 500 });
  }
}
