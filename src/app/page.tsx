import RobotCard from '@/components/RobotCard';
import { robots, news, manufacturers } from '@/data/robots';

export default function Home() {
  const featured = robots.slice(0, 6);
  const latestNews = news.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[#27272a] bg-gradient-to-b from-[#0c0c0d] via-[#131315] to-[#18181b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-teal-600/5"></div>
        <div className="relative">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            <span className="text-[#3b82f6]">Bridging</span> Tech & Everyday Life
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-[#a0a0a0]">
            Understand which humanoid robots will enter your home, workplace, school, and healthcare. 
            We track capabilities, availability, and real-world impact of every robot.
          </p>
          <div className="flex justify-center gap-4">
            <a href="/robots" className="rounded-lg bg-[#3b82f6] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#2563eb]">
              Browse Robots
            </a>
            <a href="/compare" className="rounded-lg border border-[#333] px-6 py-2.5 text-sm font-medium text-[#a0a0a0] transition hover:border-[#555] hover:text-white">
              Compare
            </a>
          </div>
          <div className="mt-12 flex justify-center gap-8 text-sm text-[#666]">
            <div><span className="text-2xl font-bold text-white">{robots.length}</span><br/>Robots</div>
            <div><span className="text-2xl font-bold text-white">{manufacturers.length}</span><br/>Manufacturers</div>
            <div><span className="text-2xl font-bold text-white">{robots.filter(r => r.status === 'shipping').length}</span><br/>Shipping</div>
          </div>
        </div>
        </div>
      </section>

      {/* Featured Robots */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Robots</h2>
          <a href="/robots" className="text-sm text-[#3b82f6] hover:underline">View all →</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(robot => (
            <RobotCard key={robot.id} robot={robot} />
          ))}
        </div>
      </section>

      {/* Latest News */}
      <section className="border-t border-[#222]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest News</h2>
            <a href="/news" className="text-sm text-[#3b82f6] hover:underline">All news →</a>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {latestNews.map(article => (
              <a key={article.id} href={`/news#${article.slug}`} className="block rounded-lg border border-[#222] bg-[#161616] p-5 transition hover:border-[#3b82f6]/40">
                <time className="text-xs text-[#666]">{article.published_at}</time>
                <h3 className="mt-1 font-medium text-white">{article.title}</h3>
                <p className="mt-2 text-sm text-[#a0a0a0] line-clamp-2">{article.content}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
