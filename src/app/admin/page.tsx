import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Hämta statistik (placeholder - ersätt med verkliga tabeller senare)
  let robotCount = 0;
  let newsCount = 0;
  let lastUpdate = 'Ingen data ännu';

  try {
    // Försök hämta från robots-tabell om den finns
    const { count: robots } = await supabase
      .from('robots')
      .select('*', { count: 'exact', head: true });
    
    if (robots !== null) {
      robotCount = robots;
    }
  } catch (error) {
    // Robots-tabell finns inte ännu
  }

  try {
    // Försök hämta från news-tabell om den finns
    const { count: news } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true });
    
    if (news !== null) {
      newsCount = news;
    }
  } catch (error) {
    // News-tabell finns inte ännu
  }

  // Hämta användarens profil
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Välkommen tillbaka till admin-panelen för hellonoid.com
        </p>
      </div>

      {/* Statistik-kort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Robotar</h3>
              <p className="text-2xl font-bold text-[#239eab]">{robotCount}</p>
              <p className="text-sm text-gray-400">Totalt antal robotar</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Nyheter</h3>
              <p className="text-2xl font-bold text-[#239eab]">{newsCount}</p>
              <p className="text-sm text-gray-400">Publicerade nyheter</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">Senaste uppdatering</h3>
              <p className="text-sm font-medium text-[#239eab]">{lastUpdate}</p>
              <p className="text-sm text-gray-400">Innehåll uppdaterat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Snabblänkar */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Snabblänkar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/robots"
            className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <span className="text-xl mr-3">🤖</span>
            <div>
              <h4 className="font-medium text-white">Hantera robotar</h4>
              <p className="text-sm text-gray-400">Lägg till, redigera eller ta bort robotar</p>
            </div>
          </a>

          <a
            href="/admin/news"
            className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
          >
            <span className="text-xl mr-3">📰</span>
            <div>
              <h4 className="font-medium text-white">Hantera nyheter</h4>
              <p className="text-sm text-gray-400">Publicera och redigera nyhetsartiklar</p>
            </div>
          </a>
        </div>
      </div>

      {/* Användarinfo */}
      {profile && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Kontoinformation</h3>
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="text-gray-400">Email:</span> {profile.email}
            </p>
            <p className="text-gray-300">
              <span className="text-gray-400">Roll:</span> 
              <span className="ml-2 text-[#239eab] font-medium uppercase tracking-wide text-sm">
                {profile.role}
              </span>
            </p>
            <p className="text-gray-300">
              <span className="text-gray-400">Medlem sedan:</span> {
                new Date(profile.created_at).toLocaleDateString('sv-SE')
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}