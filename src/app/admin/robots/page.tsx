import { createClient } from '@/lib/supabase/server';
import RobotsAdmin from './RobotsAdmin';

export default async function AdminRobotsPage() {
  const supabase = await createClient();

  const { data: robots } = await supabase
    .from('robots')
    .select('*, manufacturers(name)')
    .order('created_at', { ascending: false });

  const { data: manufacturers } = await supabase
    .from('manufacturers')
    .select('*')
    .order('name');

  return (
    <RobotsAdmin
      initialRobots={robots || []}
      manufacturers={manufacturers || []}
    />
  );
}
