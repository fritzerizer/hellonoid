import Link from 'next/link';

const steps = [
  {
    num: 1, name: 'Research', icon: 'search',
    description: 'Söker efter nya robotar på tillverkarsidor, nyhetssidor och sociala medier. Alla källor som genomsöks lagras i databasen och kan redigeras av admin.',
    details: [
      'Cronbaserade uppdateringar för robotar under research',
      'Loggning av senaste sökning per källa',
      'Stöd för tillverkarsidor, nyhetssajter, Reddit, och fler',
    ],
    automated: true,
  },
  {
    num: 2, name: 'Dublettkontroll', icon: 'copy',
    description: 'Kontrollerar att roboten inte redan finns i hellonoid.com-databasen. Matchar på namn, tillverkare och slug.',
    details: ['Fuzzy matching för att fånga varianter av robotnamn'],
    automated: true,
  },
  {
    num: 3, name: 'Skapa robot', icon: 'robot',
    description: 'Skapar en ny robotpost i databasen med status "under utredning". Grundläggande information fylls i: namn, tillverkare, kategori.',
    details: [
      'Status sätts till "researching"',
      'Höjd hämtas från specs om tillgänglig',
      'Pipeline-version startas (v1)',
    ],
    automated: false,
  },
  {
    num: 4, name: 'Skapa lagringsmapp', icon: 'folder',
    description: 'Skapar en dedikerad lagringsmapp för robotens alla tillgångar. Mappnamnet baseras på robotens databas-ID och slug.',
    details: ['Cloudflare R2 för råmaterial och 3D-modeller', 'Supabase Storage för mellansteg'],
    automated: true,
  },
  {
    num: 5, name: 'Undermappar', icon: 'folder-tree',
    description: 'Skapar standardiserade undermappar: råmaterial, 3D-modell och export.',
    details: ['raw/ — originalbilder och referensmaterial', '3d-model/ — GLB, FBX och Blender-filer', 'export/ — färdiga webbbilder'],
    automated: true,
  },
  {
    num: 6, name: 'Samla in bildmaterial', icon: 'images',
    description: 'Samlar in bilder som täcker hela roboten — framsida, baksida, sidor — i så hög upplösning som möjligt. Bilder beskärs så att bara roboten syns.',
    details: [
      'Automatisk sökning via tillverkarsidor och pressbilder',
      'Manuell uppladdning av admin med typ- och vinkelval',
      'Målvinklar: framifrån, bakifrån, vänster, höger, snett framifrån',
      'Stöd för JPG, PNG, WebP',
    ],
    automated: false,
  },
  {
    num: 7, name: 'Validera bildmaterial', icon: 'check-circle',
    description: 'Admin granskar och godkänner insamlade bilder. Kontrollerar att alla vinklar täcks och att upplösningen är tillräcklig.',
    details: [
      'Godkänn eller avvisa varje bild med fritext-kommentar',
      'Kommentarer tas med vid eventuell omgenerering',
      'Om bildmaterialet inte räcker — tillbaka till steg 6',
    ],
    automated: false,
  },
  {
    num: 8, name: 'Generera riggade vyer', icon: 'wand-magic-sparkles',
    description: 'Skapar konsistenta bilder i fasta vinklar med AI (Gemini). Sex standardvinklar genereras baserat på godkända referensbilder.',
    details: [
      'Standardvinklar: framifrån, sidan, bakifrån, snett framifrån, ovanifrån, underifrån',
      'Konfigurerbara promptar per vinkel — redigerbara i admin',
      'AI-profiler: Gemini som standard, stöd för andra modeller',
      'Robot-specifika prompt-överskridningar vid behov',
    ],
    automated: true,
  },
  {
    num: 9, name: 'Validera riggade bilder', icon: 'eye',
    description: 'Granskning av de AI-genererade vyerna. Om kvaliteten inte är tillräckligt bra skickas roboten tillbaka till steg 6 för bättre referensmaterial.',
    details: [
      'Fritext-kommentarer som följer med vid omgenerering',
      'Jämför mot referensbilder för konsistens',
    ],
    automated: false,
  },
  {
    num: 10, name: 'Uppskalning', icon: 'up-right-and-down-left-from-center',
    description: 'Skapar högupplösta versioner av varje godkänd vy separat. Maximerar bildkvalitet inför 3D-modellering.',
    details: ['AI-baserad uppskalning', 'Individuell bild per vinkel'],
    automated: true,
  },
  {
    num: 11, name: '3D-modellering', icon: 'cube',
    description: 'Skickar underlag till Meshy.ai för automatisk 3D-modellgenerering. Använder den bästa frontbilden som input.',
    details: [
      'Meshy.ai API med modell "latest" (Meshy-6)',
      '100K polygoner, triangulerad mesh',
      'PBR-texturer (metallic, roughness, normal)',
      'Automatisk symmetri',
      'Max 3 genereringar per robot (konfigurerbart)',
      'Kostnad: ~30 credits per generering (mesh + textur)',
      'Nuvarande saldo: visas i pipeline-detaljvyn',
    ],
    automated: true,
  },
  {
    num: 12, name: 'Validera 3D-modell', icon: 'check-double',
    description: 'Granskning av den genererade 3D-modellen. Kontrollerar proportioner, detaljer och texturkvalitet.',
    details: ['3D-förhandsvisning i admin', 'Om modellen inte håller måttet — ny generering eller tillbaka till steg 6'],
    automated: false,
  },
  {
    num: 13, name: 'Import till Blender', icon: 'file-import',
    description: 'Importerar den godkända 3D-modellen (GLB) i Blender för efterbearbetning.',
    details: ['Blender 5.0.1 via headless Python-script', 'Automatisk import av GLB-format'],
    automated: true,
  },
  {
    num: 14, name: 'Automatisk uppsnyggning', icon: 'broom',
    description: 'Kör fördefinierade Blender-skript för att förbättra modellens kvalitet automatiskt.',
    details: [
      'Smooth normals (30° auto-smooth)',
      'Ta bort lösa vertices',
      'Materialupprensning',
      'UV-fixar',
      'Markalignering (fötter på marken)',
      'Fördefinierade justeringar kan aktiveras/inaktiveras per robot',
    ],
    automated: true,
  },
  {
    num: 15, name: 'Manuella justeringar', icon: 'sliders',
    description: 'Möjlighet att göra ytterligare justeringar vid behov. Fördefinierade justeringar finns, plus möjlighet att lägga till egna per robot.',
    details: [
      'Fördefinierade: smooth normals, material cleanup, scale normalization, UV cleanup, ground alignment',
      'Admin kan lägga till custom-instruktioner per robot',
      'Alla justeringar loggas med tidsstämpel',
    ],
    automated: false,
  },
  {
    num: 16, name: 'Validera resultat', icon: 'clipboard-check',
    description: 'Slutgiltig validering av den färdiga 3D-modellen efter alla justeringar. Sista chansen att skicka tillbaka för förbättring.',
    details: ['Jämför med referensbilder', 'Kontrollera proportioner och detaljer'],
    automated: false,
  },
  {
    num: 17, name: 'Export för webb', icon: 'download',
    description: 'Exporterar bilder optimerade för hellonoid.com. Proportionella storlekar, transparent bakgrund och vattenstämpel.',
    details: [
      'Proportionell skalning: referenshöjd 180cm = 100% bildhöjd',
      'Robot på 150cm → tar upp 83% av bildhöjden',
      'Höjd hämtas från specs — obekräftad höjd markeras',
      'Tre exportstorlekar: thumbnail (200px), card (400px), full (1024px)',
      'Tre standardvyer: framifrån, från sidan, snett framifrån',
      'Transparent bakgrund (WebP med alpha)',
      'Vattenstämpel "hellonoid.com" på full-storlek',
      'Professionell 3-punkts ljussättning med kontaktskuggor',
    ],
    automated: true,
  },
  {
    num: 18, name: 'Ladda upp', icon: 'cloud-arrow-up',
    description: 'Laddar upp de färdiga bilderna på hellonoid.com. Uppdaterar robotens hero_image_url och bildgalleri.',
    details: ['Automatisk uppladdning till Vercel/Supabase', 'Uppdatering av robots-tabellen'],
    automated: true,
  },
  {
    num: 19, name: 'Redo att publicera', icon: 'flag-checkered',
    description: 'Roboten markeras som redo att publiceras. Admin gör en sista granskning och publicerar.',
    details: [
      'Förhandsgranskning av hur roboten ser ut live',
      'Robotstatus ändras till publicerad',
      'Pipeline-version markeras som slutförd',
    ],
    automated: false,
  },
];

export default function PipelineAboutPage() {
  const automatedCount = steps.filter(s => s.automated).length;
  const manualCount = steps.filter(s => !s.automated).length;

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Asset Pipeline</h1>
            <p className="mt-2 text-gray-400">
              19 steg från research till publicering. Varje robot går igenom denna process
              för att säkerställa konsistenta, högkvalitativa bilder på hellonoid.com.
            </p>
          </div>
          <Link href="/admin/pipeline" className="rounded-md bg-[#239eab] px-4 py-2 text-sm text-white hover:bg-[#1e8a95] transition">
            Öppna pipeline →
          </Link>
        </div>

        {/* Sammanfattning */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-[#239eab]">19</div>
            <div className="text-sm text-gray-400">Totala steg</div>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{automatedCount}</div>
            <div className="text-sm text-gray-400">Automatiserade</div>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{manualCount}</div>
            <div className="text-sm text-gray-400">Manuell granskning</div>
          </div>
        </div>

        {/* Nyckelkoncept */}
        <div className="mb-10 rounded-lg border border-[#239eab]/20 bg-[#239eab]/5 p-6">
          <h2 className="mb-3 text-lg font-semibold">Nyckelkoncept</h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">Proportionell storlek</h3>
              <p>Alla robotar renderas i proportion till varandra. En robot på 170cm tar upp mer av bilden än en på 120cm. Referenshöjd: 180cm = 100%.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Versionshantering</h3>
              <p>Varje gång en robot körs genom pipelinen ökas versionen. Tidigare versioner behålls — man kan alltid jämföra och rulla tillbaka.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Omgenerering</h3>
              <p>Redan publicerade robotar kan köras om för att förbättra kvaliteten. Bättre bilder, bättre 3D-modell, bättre specs — allt kan förfinas.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">AI-profiler</h3>
              <p>Gemini är standard för bildgenerering men andra modeller kan konfigureras. Promptar är redigerbara per vinkel och per robot.</p>
            </div>
          </div>
        </div>

        {/* Alla steg */}
        <h2 className="mb-6 text-xl font-bold">Alla steg i detalj</h2>
        <div className="space-y-4">
          {steps.map(step => (
            <div key={step.num} className="rounded-lg border border-[#222] bg-[#161616] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#239eab]/20 text-[#239eab] font-bold">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{step.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      step.automated
                        ? 'bg-green-900/40 text-green-300 border border-green-700/30'
                        : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                    }`}>
                      {step.automated ? 'Automatiserat' : 'Manuell granskning'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{step.description}</p>
                  {step.details.length > 0 && (
                    <ul className="space-y-1">
                      {step.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[#239eab]" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="mt-10 rounded-lg border border-[#222] bg-[#161616] p-6">
          <h2 className="mb-4 text-lg font-semibold">Teknikstack</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Supabase — Databas och fillagring
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Gemini 2.0 — AI-bildgenerering
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Meshy.ai — 3D-modellgenerering
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Blender 5.0 — 3D-efterbearbetning
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Next.js 15 — Admin-gränssnitt
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#239eab]">●</span> Vercel — Hosting och CDN
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Senast uppdaterad: 2026-03-10
        </div>
      </div>
    </div>
  );
}
