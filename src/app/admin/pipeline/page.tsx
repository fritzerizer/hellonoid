import { createClient } from '@supabase/supabase-js';
import AuthGuard from '@/components/AuthGuard';
import PipelineDashboard from './PipelineDashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Pipeline step definitions with labels
export const PIPELINE_STEPS = [
  { key: '01_research', num: 1, name: 'Research', icon: 'search' },
  { key: '02_duplicate_check', num: 2, name: 'Duplicate Check', icon: 'copy' },
  { key: '03_create_robot', num: 3, name: 'Create Robot', icon: 'robot' },
  { key: '04_create_storage', num: 4, name: 'Create Storage', icon: 'folder' },
  { key: '05_create_subfolders', num: 5, name: 'Subfolders', icon: 'folder-tree' },
  { key: '06_collect_media', num: 6, name: 'Collect Media', icon: 'images' },
  { key: '07_validate_media', num: 7, name: 'Validate Media', icon: 'check-circle' },
  { key: '08_generate_views', num: 8, name: 'Generate Views', icon: 'wand-magic-sparkles' },
  { key: '09_validate_views', num: 9, name: 'Validate Views', icon: 'eye' },
  { key: '10_upscale_views', num: 10, name: 'Upscale', icon: 'up-right-and-down-left-from-center' },
  { key: '11_3d_modeling', num: 11, name: '3D Modeling', icon: 'cube' },
  { key: '12_validate_3d', num: 12, name: 'Validate 3D', icon: 'check-double' },
  { key: '13_import_blender', num: 13, name: 'Import Blender', icon: 'file-import' },
  { key: '14_auto_cleanup', num: 14, name: 'Auto Cleanup', icon: 'broom' },
  { key: '15_manual_adjustments', num: 15, name: 'Adjustments', icon: 'sliders' },
  { key: '16_validate_result', num: 16, name: 'Validate Result', icon: 'clipboard-check' },
  { key: '17_export_web', num: 17, name: 'Export Web', icon: 'download' },
  { key: '18_upload', num: 18, name: 'Upload', icon: 'cloud-arrow-up' },
  { key: '19_ready_to_publish', num: 19, name: 'Ready to Publish', icon: 'flag-checkered' },
] as const;

async function getData() {
  const [pipelinesRes, robotsRes, sourcesRes, mediaRes] = await Promise.all([
    supabase.from('robot_pipeline').select('*, robots(name, slug, status)').order('updated_at', { ascending: false }),
    supabase.from('robots').select('id, name, slug, status').order('name'),
    supabase.from('pipeline_sources').select('*').order('name'),
    supabase.from('pipeline_media').select('pipeline_id, media_type, validation_status'),
  ]);

  return {
    pipelines: pipelinesRes.data ?? [],
    robots: robotsRes.data ?? [],
    sources: sourcesRes.data ?? [],
    media: mediaRes.data ?? [],
  };
}

export default async function PipelinePage() {
  const data = await getData();

  return (
    <AuthGuard requireRole="agent">
      <div className="min-h-screen bg-[#0c0c0d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Asset Pipeline</h1>
              <p className="mt-1 text-sm text-gray-400">
                19-step workflow from research to publication
              </p>
            </div>
            <a href="/admin" className="text-sm text-[#239eab] hover:underline">
              ← Back to Admin
            </a>
          </div>

          <PipelineDashboard
            initialPipelines={data.pipelines}
            robots={data.robots}
            sources={data.sources}
            media={data.media}
            steps={PIPELINE_STEPS}
          />
        </div>
      </div>
    </AuthGuard>
  );
}

export const revalidate = 30;
