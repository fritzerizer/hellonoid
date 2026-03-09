import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const VALID_STATUSES = ['draft', 'approved', 'rejected', 'published'];

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verify admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase
    .from('news')
    .update({ status })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, status });
}
