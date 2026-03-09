import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/Icon';
import { NewsActions } from './NewsActions';
import type { NewsArticle } from '@/data/robots';

export const dynamic = 'force-dynamic';

export default async function AdminNews() {
  const supabase = await createClient();

  const { data: news } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: robots } = await supabase
    .from('robots')
    .select('id, name, slug');

  const articles = (news ?? []) as NewsArticle[];
  const robotList = (robots ?? []) as { id: number; name: string; slug: string }[];

  const drafts = articles.filter(a => a.status === 'draft');
  const published = articles.filter(a => a.status === 'published');
  const approved = articles.filter(a => a.status === 'approved');
  const rejected = articles.filter(a => a.status === 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Icon name="newspaper" className="text-[#239eab]" />
          News
        </h1>
        <p className="mt-1 text-gray-400">
          Review, approve and manage news articles
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="inbox" label="Drafts" count={drafts.length} color="yellow" />
        <StatCard icon="check" label="Approved" count={approved.length} color="blue" />
        <StatCard icon="globe" label="Published" count={published.length} color="green" />
        <StatCard icon="ban" label="Rejected" count={rejected.length} color="red" />
      </div>

      {/* Drafts awaiting review */}
      {drafts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <Icon name="inbox" className="text-yellow-400" />
            Awaiting review ({drafts.length})
          </h2>
          <div className="space-y-4">
            {drafts.map(article => (
              <NewsCard key={article.id} article={article} robots={robotList} showActions />
            ))}
          </div>
        </section>
      )}

      {/* Approved (ready to publish) */}
      {approved.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
            <Icon name="check-circle" className="text-blue-400" />
            Approved ({approved.length})
          </h2>
          <div className="space-y-4">
            {approved.map(article => (
              <NewsCard key={article.id} article={article} robots={robotList} showActions />
            ))}
          </div>
        </section>
      )}

      {/* Published */}
      <section>
        <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
          <Icon name="globe" className="text-green-400" />
          Published ({published.length})
        </h2>
        <div className="space-y-4">
          {published.map(article => (
            <NewsCard key={article.id} article={article} robots={robotList} />
          ))}
        </div>
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
            <Icon name="ban" className="text-red-400" />
            Rejected ({rejected.length})
          </h2>
          <div className="space-y-4">
            {rejected.map(article => (
              <NewsCard key={article.id} article={article} robots={robotList} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'text-yellow-400 bg-yellow-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
  };
  const cls = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.split(' ')[1]}`}>
          <Icon name={icon} className={cls.split(' ')[0]} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{count}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function NewsCard({
  article,
  robots,
  showActions = false,
}: {
  article: NewsArticle;
  robots: { id: number; name: string; slug: string }[];
  showActions?: boolean;
}) {
  const robot = article.robot_id ? robots.find(r => r.id === article.robot_id) : null;
  const significanceLabels = ['—', '⭐', '⭐⭐', '⭐⭐⭐'];

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {article.source_name && (
              <span className="text-xs text-gray-500">{article.source_name}</span>
            )}
            {article.published_at && (
              <span className="text-xs text-gray-500">
                {new Date(article.published_at).toLocaleDateString('sv-SE')}
              </span>
            )}
            {robot && (
              <span className="rounded-full bg-[#239eab]/10 px-2 py-0.5 text-xs text-[#239eab]">
                {robot.name}
              </span>
            )}
            {article.significance > 0 && (
              <span className="text-xs">{significanceLabels[article.significance] || '⭐'}</span>
            )}
            {article.tags?.map(tag => (
              <span key={tag} className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">{article.title}</h3>

          {article.summary && (
            <p className="text-sm text-gray-300 mb-2">{article.summary}</p>
          )}

          {!article.summary && article.content && (
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{article.content}</p>
          )}

          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#239eab] hover:underline"
            >
              {article.source_url}
            </a>
          )}
        </div>

        {showActions && (
          <NewsActions articleId={article.id} currentStatus={article.status} />
        )}
      </div>
    </div>
  );
}
