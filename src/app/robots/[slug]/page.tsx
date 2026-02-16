import { robots, manufacturers, robotSpecs, getRobotWithDetails, news } from '@/data/robots';
import SpecTable from '@/components/SpecTable';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return robots.map(r => ({ slug: r.slug }));
}

const statusColors: Record<string, string> = {
  shipping: 'bg-green-500/20 text-green-400',
  development: 'bg-yellow-500/20 text-yellow-400',
  announced: 'bg-purple-500/20 text-purple-400',
  discontinued: 'bg-gray-500/20 text-gray-400',
};

export default async function RobotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getRobotWithDetails(slug);
  if (!data) notFound();

  const { robot, manufacturer, specs } = data;
  const relatedNews = news.filter(n => n.robot_id === robot.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-[#666]">
        <a href="/robots" className="hover:text-white">Robots</a>
        <span className="mx-2">›</span>
        <span className="text-[#a0a0a0]">{robot.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main content */}
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[robot.status]}`}>
                {robot.status}
              </span>
              <span className="text-sm text-[#666]">{robot.category}</span>
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{robot.name}</h1>
            <a href="#" className="text-sm text-[#3b82f6] hover:underline">{manufacturer.name}</a>
            <span className="mx-2 text-[#333]">·</span>
            <span className="text-sm text-[#666]">{manufacturer.country}</span>
          </div>

          {/* Hero image placeholder */}
          <div className="mb-8 flex h-64 items-center justify-center rounded-xl border border-[#222] bg-[#111] text-6xl text-[#333]">
            🤖
          </div>

          <p className="mb-8 text-lg text-[#a0a0a0]">{robot.summary}</p>

          {/* Specs */}
          <h2 className="mb-4 text-xl font-semibold">Specifications</h2>
          <SpecTable specs={specs} />

          {/* Related News */}
          {relatedNews.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Related News</h2>
              <div className="space-y-3">
                {relatedNews.map(article => (
                  <div key={article.id} className="rounded-lg border border-[#222] bg-[#161616] p-4">
                    <time className="text-xs text-[#666]">{article.published_at}</time>
                    <h3 className="mt-1 font-medium">{article.title}</h3>
                    <p className="mt-1 text-sm text-[#a0a0a0] line-clamp-2">{article.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-medium text-[#a0a0a0]">Quick Specs</h3>
            {specs.filter(s => ['Height', 'Weight', 'Top Speed', 'Walking Speed', 'Payload', 'Battery Life', 'Price'].includes(s.spec_key)).map(s => (
              <div key={s.id} className="flex justify-between border-b border-[#1a1a1a] py-2 text-sm last:border-0">
                <span className="text-[#666]">{s.spec_key}</span>
                <span className="font-medium">{s.spec_value} {s.spec_unit}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#222] bg-[#161616] p-5">
            <h3 className="mb-3 text-sm font-medium text-[#a0a0a0]">Manufacturer</h3>
            <p className="font-medium">{manufacturer.name}</p>
            <p className="mt-1 text-sm text-[#666]">{manufacturer.country} · Founded {manufacturer.founded_year}</p>
            <p className="mt-2 text-sm text-[#a0a0a0]">{manufacturer.description}</p>
            {manufacturer.website && (
              <a href={manufacturer.website} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-[#3b82f6] hover:underline">
                Website →
              </a>
            )}
          </div>

          <a href={`/compare?robots=${robot.slug}`} className="block rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4 text-center text-sm font-medium text-[#3b82f6] transition hover:bg-[#3b82f6]/20">
            Compare this robot →
          </a>
        </aside>
      </div>
    </div>
  );
}
