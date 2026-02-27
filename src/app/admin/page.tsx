import { createClient } from '@/lib/supabase/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faNewspaper, faClock, faUser, faEnvelope, faShieldHalved, faCalendarDay } from '@fortawesome/free-solid-svg-icons';

export default async function AdminDashboard() {
  const supabase = await createClient();

  let robotCount = 0;
  let newsCount = 0;
  let lastUpdate = 'Ingen data ännu';

  try {
    const { count: robots } = await supabase
      .from('robots')
      .select('*', { count: 'exact', head: true });
    if (robots !== null) robotCount = robots;
  } catch {}

  try {
    const { count: news } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true });
    if (news !== null) newsCount = news;
  } catch {}

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Welcome back to the hellonoid.com admin panel
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-[#239eab]/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-[#239eab] text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Robots</h3>
              <p className="text-2xl font-bold text-[#239eab]">{robotCount}</p>
              <p className="text-sm text-gray-400">Total in database</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-[#239eab]/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faNewspaper} className="text-[#239eab] text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">News</h3>
              <p className="text-2xl font-bold text-[#239eab]">{newsCount}</p>
              <p className="text-sm text-gray-400">Published articles</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-[#239eab]/20 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="text-[#239eab] text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Last update</h3>
              <p className="text-sm font-medium text-[#239eab]">{lastUpdate}</p>
              <p className="text-sm text-gray-400">Content updated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Quick links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/robots"
            className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="w-10 h-10 bg-[#239eab]/20 rounded-lg flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faRobot} className="text-[#239eab]" />
            </div>
            <div>
              <h4 className="font-medium text-white">Manage robots</h4>
              <p className="text-sm text-gray-400">Add, edit or remove robots</p>
            </div>
          </a>

          <a
            href="/admin/news"
            className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <div className="w-10 h-10 bg-[#239eab]/20 rounded-lg flex items-center justify-center mr-3">
              <FontAwesomeIcon icon={faNewspaper} className="text-[#239eab]" />
            </div>
            <div>
              <h4 className="font-medium text-white">Manage news</h4>
              <p className="text-sm text-gray-400">Publish and edit news articles</p>
            </div>
          </a>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Account</h3>
          <div className="space-y-3">
            <p className="text-gray-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 w-4" />
              <span className="text-gray-400">Email:</span> {profile.email}
            </p>
            <p className="text-gray-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-gray-500 w-4" />
              <span className="text-gray-400">Role:</span>
              <span className="text-[#239eab] font-medium uppercase tracking-wide text-sm">
                {profile.role}
              </span>
            </p>
            <p className="text-gray-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDay} className="text-gray-500 w-4" />
              <span className="text-gray-400">Member since:</span> {
                new Date(profile.created_at).toLocaleDateString('sv-SE')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
