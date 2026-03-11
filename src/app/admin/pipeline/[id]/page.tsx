import { notFound } from 'next/navigation';
import PipelineDetail from './PipelineDetail';
import { PIPELINE_STEPS } from '../page';
import { getSupabase } from '@/lib/auth';

interface Props {
  params: Promise<{ id: string }>;
}

async function getData(id: number) {
  const supabase = getSupabase();
  const [pipelineRes, mediaRes, logRes, promptsRes, adjustmentsRes, exportConfigRes] = await Promise.all([
    supabase.from('robot_pipeline').select('*, robots(id, name, slug, status, hero_image_url)').eq('id', id).single(),
    supabase.from('pipeline_media').select('*').eq('pipeline_id', id).order('created_at', { ascending: false }),
    supabase.from('pipeline_step_log').select('*').eq('pipeline_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('pipeline_prompts').select('*').order('id'),
    supabase.from('pipeline_adjustments').select('*').order('id'),
    supabase.from('pipeline_export_config').select('*').order('id'),
  ]);

  if (pipelineRes.error || !pipelineRes.data) return null;

  return {
    pipeline: pipelineRes.data,
    media: mediaRes.data ?? [],
    log: logRes.data ?? [],
    prompts: promptsRes.data ?? [],
    adjustments: adjustmentsRes.data ?? [],
    exportConfigs: exportConfigRes.data ?? [],
  };
}

export default async function PipelineDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getData(parseInt(id));

  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <a href="/admin/pipeline" className="text-sm text-[#239eab] hover:underline">
            ← Pipeline
          </a>
          <h1 className="text-2xl font-bold">{data.pipeline.robots?.name}</h1>
          <span className="text-sm text-gray-400">v{data.pipeline.version}</span>
        </div>

        <PipelineDetail
          pipeline={data.pipeline}
          media={data.media}
          log={data.log}
          prompts={data.prompts}
          adjustments={data.adjustments}
          exportConfigs={data.exportConfigs}
          steps={PIPELINE_STEPS}
        />
      </div>
    </div>
  );
}

export const revalidate = 10;
