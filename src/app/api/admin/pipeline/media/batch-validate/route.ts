import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, requireAuth } from '@/lib/auth';

/**
 * POST /api/admin/pipeline/media/batch-validate
 * Batch approve/reject multiple media items at once.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, 'agent');
    const supabase = getSupabase();
    const { media_ids, status, comment } = await req.json();

    if (!media_ids || !Array.isArray(media_ids) || media_ids.length === 0) {
      return NextResponse.json({ error: 'media_ids array required' }, { status: 400 });
    }
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pipeline_media')
      .update({
        validation_status: status,
        validation_comment: comment || null,
        validated_by: user.email,
      })
      .in('id', media_ids)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: data?.length || 0, items: data });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Batch validate error:', error);
    return NextResponse.json({ error: `Batch validation failed: ${error.message}` }, { status: 500 });
  }
}
