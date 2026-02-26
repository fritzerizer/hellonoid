import { news, robots } from '@/data/robots';

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">News</h1>
      <div className="space-y-6">
        {news.map(article => {
          const robot = article.robot_id ? robots.find(r => r.id === article.robot_id) : null;
          return (
            <article key={article.id} id={article.slug} className="rounded-lg border border-[#222] bg-[#161616] p-6">
              <div className="mb-2 flex items-center gap-3">
                <time className="text-xs text-[#666]">{article.published_at}</time>
                {robot && (
                  <a href={`/robots/${robot.slug}`} className="rounded-full bg-[#239eab]/10 px-2 py-0.5 text-xs text-[#239eab] hover:underline">
                    {robot.name}
                  </a>
                )}
              </div>
              <h2 className="mb-3 text-xl font-semibold">{article.title}</h2>
              <p className="text-[#a0a0a0] leading-relaxed">{article.content}</p>
              {article.source_url && (
                <a href={article.source_url} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-[#239eab] hover:underline">
                  Source →
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
