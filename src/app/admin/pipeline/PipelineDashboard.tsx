'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiClient } from '@/hooks/useApiClient';
import { api } from '@/lib/api-client';
import Icon from '@/components/Icon';

interface Pipeline {
  id: number;
  robot_id: number;
  current_step: string;
  status: string;
  version: number;
  height_confirmed: boolean;
  height_cm: number | null;
  meshy_credits_used: number;
  meshy_generations: number;
  max_generations: number;
  started_at: string;
  notes: string | null;
  robots?: { name: string; slug: string; status: string };
}

interface Robot {
  id: number;
  name: string;
  slug: string;
  status: string;
}

interface Source {
  id: number;
  name: string;
  url: string;
  source_type: string;
  enabled: boolean;
  last_searched_at: string | null;
  robots_found: number;
}

interface Media {
  pipeline_id: number;
  media_type: string;
  validation_status: string;
}

interface Step {
  key: string;
  num: number;
  name: string;
  icon: string;
}

interface Props {
  initialPipelines: Pipeline[];
  robots: Robot[];
  sources: Source[];
  media: Media[];
  steps: readonly Step[];
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-400/10 text-blue-400 border-blue-300/30',
  failed: 'bg-red-400/10 text-red-400 border-red-300/30',
};

export default function PipelineDashboard({ initialPipelines, robots, sources, media, steps }: Props) {
  const { user } = useAuth();
  useApiClient(); // Set up auth token provider
  
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [tab, setTab] = useState<'overview' | 'robots' | 'sources'>('overview');
  const [showAddRobot, setShowAddRobot] = useState(false);
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Robots not yet in pipeline
  const pipelineRobotIds = new Set(pipelines.map(p => p.robot_id));
  const availableRobots = robots.filter(r => !pipelineRobotIds.has(r.id));

  // Step stats
  const stepCounts: Record<string, number> = {};
  for (const p of pipelines) {
    stepCounts[p.current_step] = (stepCounts[p.current_step] || 0) + 1;
  }

  function getStepNum(stepKey: string): number {
    return steps.find(s => s.key === stepKey)?.num ?? 0;
  }

  function getStepName(stepKey: string): string {
    const step = steps.find(s => s.key === stepKey);
    return step ? `${step.num}. ${step.name}` : stepKey;
  }

  async function addRobotToPipeline() {
    if (!selectedRobotId) return;
    setLoading(true);
    setError(null);
    try {
      const newPipeline = await api.post('/api/admin/pipeline', { 
        robot_id: selectedRobotId 
      });
      setPipelines([newPipeline, ...pipelines]);
      setShowAddRobot(false);
      setSelectedRobotId(null);
    } catch (err: any) {
      setError(`Failed to add robot to pipeline: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function advanceStep(pipelineId: number, comment?: string) {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.post('/api/admin/pipeline/advance', {
        pipeline_id: pipelineId,
        action: 'approve',
        comment
      });
      setPipelines(pipelines.map(p => p.id === pipelineId ? { ...p, ...updated } : p));
    } catch (err: any) {
      setError(`Failed to advance pipeline: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function rejectStep(pipelineId: number, comment: string, targetStep: string) {
    setLoading(true);
    setError(null);
    try {
      const updated = await api.post('/api/admin/pipeline/advance', {
        pipeline_id: pipelineId,
        action: 'reject',
        comment,
        target_step: targetStep
      });
      setPipelines(pipelines.map(p => p.id === pipelineId ? { ...p, ...updated } : p));
    } catch (err: any) {
      setError(`Failed to reject pipeline: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-4">
          <div className="flex items-start gap-2">
            <Icon name="exclamation-triangle" className="text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400">Error</h4>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <Icon name="xmark" />
            </button>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
          <div className="text-2xl font-bold text-[#239eab]">{pipelines.length}</div>
          <div className="text-sm text-gray-400">In Pipeline</div>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
          <div className="text-2xl font-bold text-green-400">{pipelines.filter(p => p.status === 'active').length}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
          <div className="text-2xl font-bold text-blue-400">{pipelines.filter(p => p.status === 'completed').length}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
          <div className="text-2xl font-bold text-gray-400">{availableRobots.length}</div>
          <div className="text-sm text-gray-400">Not in Pipeline</div>
        </div>
      </div>

      {/* Step overview bar */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-1 min-w-[800px]">
          {steps.map(step => {
            const count = stepCounts[step.key] || 0;
            return (
              <div
                key={step.key}
                className={`flex-1 rounded p-2 text-center text-xs ${count > 0 ? 'bg-[#239eab]/20 border border-[#239eab]/30' : 'bg-[#1a1a1d] border border-[#222]'}`}
                title={`${step.num}. ${step.name}`}
              >
                <div className="font-bold">{step.num}</div>
                <div className={`text-[10px] ${count > 0 ? 'text-[#239eab]' : 'text-gray-500'}`}>
                  {count > 0 && <span className="font-bold">{count}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[#222] pb-2">
        {(['overview', 'robots', 'sources'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium transition ${tab === t ? 'text-[#239eab] border-b-2 border-[#239eab]' : 'text-gray-400 hover:text-white'}`}
          >
            {t === 'overview' ? 'Pipeline Overview' : t === 'robots' ? 'All Robots' : 'Sources'}
          </button>
        ))}
      </div>

      {/* Tab: Pipeline Overview */}
      {tab === 'overview' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowAddRobot(!showAddRobot)}
              className="rounded-md bg-[#239eab] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a95] transition"
            >
              <Icon name="plus" /> Add Robot to Pipeline
            </button>
          </div>

          {showAddRobot && (
            <div className="mb-6 rounded-lg border border-[#239eab]/30 bg-[#1a1a1d] p-4">
              <h3 className="mb-3 font-semibold">Add Robot to Pipeline</h3>
              <div className="flex gap-3">
                <select
                  value={selectedRobotId ?? ''}
                  onChange={e => setSelectedRobotId(Number(e.target.value) || null)}
                  className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select a robot...</option>
                  {availableRobots.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={addRobotToPipeline}
                  disabled={!selectedRobotId || loading}
                  className="rounded-md bg-[#239eab] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a95] disabled:opacity-50 transition"
                >
                  {loading ? 'Adding...' : 'Start Pipeline'}
                </button>
              </div>
            </div>
          )}

          {/* Pipeline cards */}
          <div className="space-y-3">
            {pipelines.length === 0 ? (
              <div className="rounded-lg border border-[#222] bg-[#161616] p-8 text-center text-gray-400">
                No robots in pipeline yet. Add one to get started.
              </div>
            ) : (
              pipelines.map(p => {
                const stepInfo = steps.find(s => s.key === p.current_step);
                const progress = stepInfo ? (stepInfo.num / 19) * 100 : 0;
                const mediaForPipeline = media.filter(m => m.pipeline_id === p.id);
                const approvedMedia = mediaForPipeline.filter(m => m.validation_status === 'approved').length;

                return (
                  <div key={p.id} className="rounded-lg border border-[#222] bg-[#161616] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {p.robots?.name || `Robot #${p.robot_id}`}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                            {p.status}
                          </span>
                          <span className="text-xs text-gray-400">v{p.version}</span>
                          {p.meshy_generations > 0 && (
                            <span className="text-xs text-gray-400">
                              <Icon name="cube" /> {p.meshy_generations}/{p.max_generations} Meshy
                            </span>
                          )}
                          {approvedMedia > 0 && (
                            <span className="text-xs text-gray-400">
                              <Icon name="image" /> {approvedMedia} media
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[#239eab]">
                          {getStepName(p.current_step)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(p.started_at).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3 h-1.5 w-full rounded-full bg-[#222]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#239eab] to-[#74deee] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Step indicators */}
                    <div className="flex gap-0.5 mb-3">
                      {steps.map(step => {
                        const isCurrent = step.key === p.current_step;
                        const isPast = step.num < (stepInfo?.num ?? 0);
                        return (
                          <div
                            key={step.key}
                            className={`h-1 flex-1 rounded-sm ${isCurrent ? 'bg-[#239eab]' : isPast ? 'bg-[#239eab]/40' : 'bg-[#222]'}`}
                            title={`${step.num}. ${step.name}`}
                          />
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => advanceStep(p.id)}
                        disabled={loading || p.status !== 'active'}
                        className="rounded bg-green-900/50 border border-green-700 px-3 py-1 text-xs text-green-300 hover:bg-green-800 disabled:opacity-50 transition"
                      >
                        <Icon name="check" /> Approve & Next
                      </button>
                      <button
                        onClick={() => {
                          const comment = prompt('Rejection comment:');
                          if (comment) rejectStep(p.id, comment, '06_collect_media');
                        }}
                        disabled={loading || p.status !== 'active'}
                        className="rounded bg-red-900/50 border border-red-700 px-3 py-1 text-xs text-red-300 hover:bg-red-800 disabled:opacity-50 transition"
                      >
                        <Icon name="rotate-left" /> Send Back
                      </button>
                      <a
                        href={`/admin/pipeline/${p.id}`}
                        className="rounded bg-gray-800 border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700 transition"
                      >
                        <Icon name="eye" /> Details
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: All Robots */}
      {tab === 'robots' && (
        <div className="grid gap-2">
          {robots.map(r => {
            const pipeline = pipelines.find(p => p.robot_id === r.id);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#161616] p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">#{r.id}</span>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-gray-400">{r.status}</span>
                </div>
                {pipeline ? (
                  <span className="text-xs text-[#239eab]">{getStepName(pipeline.current_step)}</span>
                ) : (
                  <button
                    onClick={() => { setSelectedRobotId(r.id); setShowAddRobot(true); setTab('overview'); }}
                    className="text-xs text-gray-400 hover:text-[#239eab] transition"
                  >
                    Add to pipeline →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Sources */}
      {tab === 'sources' && (
        <div className="grid gap-2">
          {sources.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#161616] p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.enabled ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">{s.source_type}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{s.url}</div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>{s.robots_found} found</div>
                <div>{s.last_searched_at ? new Date(s.last_searched_at).toLocaleDateString('sv-SE') : 'Never searched'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
