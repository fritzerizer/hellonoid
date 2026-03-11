'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  updated_at?: string;
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

interface LogEntry {
  id: number;
  pipeline_id: number;
  step: string;
  action: string;
  comment: string | null;
  performed_by: string | null;
  created_at: string;
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
  recentActivity: LogEntry[];
  steps: readonly Step[];
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-400/10 text-blue-400 border-blue-300/30',
  failed: 'bg-red-400/10 text-red-400 border-red-300/30',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-4 right-4 z-[60] rounded-lg border px-4 py-3 text-sm text-white shadow-xl backdrop-blur-sm animate-slide-up ${
      type === 'success' ? 'bg-green-600/90 border-green-500' : 'bg-red-600/90 border-red-500'
    }`}>
      <div className="flex items-center gap-2">
        <Icon name={type === 'success' ? 'check-circle' : 'exclamation-triangle'} />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

// Confirm dialog
function ConfirmDialog({ title, message, onConfirm, onCancel, showInput, inputPlaceholder }: {
  title: string; message: string; onConfirm: (value?: string) => void; onCancel: () => void;
  showInput?: boolean; inputPlaceholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl border border-[#333] bg-[#1a1a1d] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        {showInput && (
          <textarea value={inputValue} onChange={e => setInputValue(e.target.value)}
            placeholder={inputPlaceholder} className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 mb-4" rows={2} />
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition">Cancel</button>
          <button onClick={() => onConfirm(inputValue || undefined)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelineDashboard({ initialPipelines, robots, sources, media, recentActivity, steps }: Props) {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [tab, setTab] = useState<'overview' | 'robots' | 'sources' | 'activity'>('overview');
  const [showAddRobot, setShowAddRobot] = useState(false);
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Robots not yet in pipeline
  const pipelineRobotIds = new Set(pipelines.map(p => p.robot_id));
  const availableRobots = robots.filter(r => !pipelineRobotIds.has(r.id));

  // Step stats
  const stepCounts: Record<string, number> = {};
  for (const p of pipelines) {
    stepCounts[p.current_step] = (stepCounts[p.current_step] || 0) + 1;
  }

  // Filtered pipelines
  const filteredPipelines = useMemo(() => {
    return pipelines.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const robotName = p.robots?.name?.toLowerCase() || '';
        const robotSlug = p.robots?.slug?.toLowerCase() || '';
        if (!robotName.includes(q) && !robotSlug.includes(q)) return false;
      }
      return true;
    });
  }, [pipelines, statusFilter, searchQuery]);

  function getStepNum(stepKey: string): number {
    return steps.find(s => s.key === stepKey)?.num ?? 0;
  }

  function getStepName(stepKey: string): string {
    const step = steps.find(s => s.key === stepKey);
    return step ? `${step.num}. ${step.name}` : stepKey;
  }

  async function apiPost(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function addRobotToPipeline() {
    if (!selectedRobotId) return;
    setLoading(true);
    setError(null);
    try {
      const newPipeline = await apiPost('/api/admin/pipeline', { robot_id: selectedRobotId });
      setPipelines([newPipeline, ...pipelines]);
      setShowAddRobot(false);
      setSelectedRobotId(null);
      setToast({ message: 'Robot added to pipeline!', type: 'success' });
    } catch (err: any) {
      setError(`Failed to add robot to pipeline: ${err.message}`);
      setToast({ message: `Failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function advanceStep(pipelineId: number, comment?: string) {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiPost('/api/admin/pipeline/advance', {
        pipeline_id: pipelineId, action: 'approve', comment,
      });
      setPipelines(pipelines.map(p => p.id === pipelineId ? { ...p, ...updated } : p));
      setToast({ message: 'Step approved!', type: 'success' });
    } catch (err: any) {
      setError(`Failed to advance pipeline: ${err.message}`);
      setToast({ message: `Failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function rejectStep(pipelineId: number, comment: string, targetStep: string) {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiPost('/api/admin/pipeline/advance', {
        pipeline_id: pipelineId, action: 'reject', comment, target_step: targetStep,
      });
      setPipelines(pipelines.map(p => p.id === pipelineId ? { ...p, ...updated } : p));
      setToast({ message: 'Pipeline sent back', type: 'success' });
    } catch (err: any) {
      setError(`Failed to reject pipeline: ${err.message}`);
      setToast({ message: `Failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Status counts
  const statusCounts = {
    active: pipelines.filter(p => p.status === 'active').length,
    completed: pipelines.filter(p => p.status === 'completed').length,
    paused: pipelines.filter(p => p.status === 'paused').length,
  };

  return (
    <div>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-4">
          <div className="flex items-start gap-2">
            <Icon name="exclamation-triangle" className="text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400">Error</h4>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <Icon name="xmark" />
            </button>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button onClick={() => setStatusFilter('all')} className={`rounded-lg border p-4 text-left transition hover:border-[#239eab]/30 ${statusFilter === 'all' ? 'border-[#239eab]/30 bg-[#239eab]/5' : 'border-[#222] bg-[#161616]'}`}>
          <div className="text-2xl font-bold text-[#239eab]">{pipelines.length}</div>
          <div className="text-sm text-gray-400">In Pipeline</div>
        </button>
        <button onClick={() => setStatusFilter('active')} className={`rounded-lg border p-4 text-left transition hover:border-green-500/30 ${statusFilter === 'active' ? 'border-green-500/30 bg-green-900/10' : 'border-[#222] bg-[#161616]'}`}>
          <div className="text-2xl font-bold text-green-400">{statusCounts.active}</div>
          <div className="text-sm text-gray-400">Active</div>
        </button>
        <button onClick={() => setStatusFilter('completed')} className={`rounded-lg border p-4 text-left transition hover:border-blue-500/30 ${statusFilter === 'completed' ? 'border-blue-500/30 bg-blue-900/10' : 'border-[#222] bg-[#161616]'}`}>
          <div className="text-2xl font-bold text-blue-400">{statusCounts.completed}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </button>
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
                className={`flex-1 rounded p-2 text-center text-xs transition ${count > 0 ? 'bg-[#239eab]/20 border border-[#239eab]/30' : 'bg-[#1a1a1d] border border-[#222]'}`}
                title={`${step.num}. ${step.name}: ${count} robot${count !== 1 ? 's' : ''}`}
              >
                <div className="font-bold">{step.num}</div>
                <div className={`text-[10px] ${count > 0 ? 'text-[#239eab]' : 'text-gray-500'}`}>
                  {count > 0 ? <span className="font-bold">{count}</span> : '·'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[#222] pb-2 overflow-x-auto">
        {([
          { key: 'overview', label: 'Pipeline Overview', icon: 'gauge-high' },
          { key: 'activity', label: 'Recent Activity', icon: 'clock-rotate-left' },
          { key: 'robots', label: 'All Robots', icon: 'robot' },
          { key: 'sources', label: 'Sources', icon: 'globe' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              tab === t.key ? 'text-[#239eab] border-b-2 border-[#239eab]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Pipeline Overview */}
      {tab === 'overview' && (
        <div>
          {/* Search and add */}
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Icon name="magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search robots..."
                className="w-full rounded-md border border-gray-600 bg-gray-800 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#239eab] focus:ring-1 focus:ring-[#239eab] transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <Icon name="xmark" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAddRobot(!showAddRobot)}
              className="rounded-md bg-[#239eab] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a95] transition flex items-center gap-1.5"
            >
              <Icon name="plus" /> Add Robot to Pipeline
            </button>
          </div>

          {/* Active filter indicator */}
          {(statusFilter !== 'all' || searchQuery) && (
            <div className="mb-3 flex items-center gap-2 text-xs">
              <span className="text-gray-500">Showing:</span>
              {statusFilter !== 'all' && (
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-300">
                  {statusFilter} <button onClick={() => setStatusFilter('all')} className="ml-1 text-gray-500 hover:text-white">✕</button>
                </span>
              )}
              {searchQuery && (
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-300">
                  &quot;{searchQuery}&quot; <button onClick={() => setSearchQuery('')} className="ml-1 text-gray-500 hover:text-white">✕</button>
                </span>
              )}
              <span className="text-gray-600">{filteredPipelines.length} of {pipelines.length} pipelines</span>
            </div>
          )}

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
                  className="rounded-md bg-[#239eab] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a95] disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {loading ? <Spinner /> : null}
                  {loading ? 'Adding...' : 'Start Pipeline'}
                </button>
              </div>
            </div>
          )}

          {/* Pipeline cards */}
          <div className="space-y-3">
            {filteredPipelines.length === 0 ? (
              <div className="rounded-lg border border-[#222] bg-[#161616] p-8 text-center text-gray-400">
                {pipelines.length === 0 ? 'No robots in pipeline yet. Add one to get started.' : 'No pipelines match your filters.'}
              </div>
            ) : (
              filteredPipelines.map(p => {
                const stepInfo = steps.find(s => s.key === p.current_step);
                const progress = stepInfo ? (stepInfo.num / 19) * 100 : 0;
                const mediaForPipeline = media.filter(m => m.pipeline_id === p.id);
                const approvedMedia = mediaForPipeline.filter(m => m.validation_status === 'approved').length;
                const pendingMedia = mediaForPipeline.filter(m => m.validation_status === 'pending').length;

                return (
                  <div key={p.id} className="rounded-lg border border-[#222] bg-[#161616] p-4 hover:border-[#333] transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <a href={`/admin/pipeline/${p.id}`} className="font-semibold text-white hover:text-[#239eab] transition">
                          {p.robots?.name || `Robot #${p.robot_id}`}
                        </a>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                            {p.status}
                          </span>
                          <span className="text-xs text-gray-400">v{p.version}</span>
                          {p.meshy_generations > 0 && (
                            <span className="text-xs text-gray-400">
                              <Icon name="cube" /> {p.meshy_generations}/{p.max_generations}
                            </span>
                          )}
                          {approvedMedia > 0 && (
                            <span className="text-xs text-gray-400">
                              <Icon name="image" /> {approvedMedia} approved
                            </span>
                          )}
                          {pendingMedia > 0 && (
                            <span className="text-xs text-yellow-400">
                              <Icon name="clock" /> {pendingMedia} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[#239eab]">
                          {getStepName(p.current_step)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(progress)}% complete
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
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => advanceStep(p.id)}
                        disabled={loading || p.status !== 'active'}
                        className="rounded bg-green-900/50 border border-green-700 px-3 py-1 text-xs text-green-300 hover:bg-green-800 disabled:opacity-50 transition flex items-center gap-1"
                      >
                        {loading ? <Spinner /> : <Icon name="check" />} Approve
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            title: `Send Back: ${p.robots?.name}`,
                            message: 'This will send the pipeline back to Collect Media (step 6).',
                            showInput: true,
                            inputPlaceholder: 'Reason for sending back...',
                            onConfirm: (comment?: string) => {
                              setConfirmDialog(null);
                              rejectStep(p.id, comment || 'Sent back from dashboard', '06_collect_media');
                            },
                            onCancel: () => setConfirmDialog(null),
                          });
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

      {/* Tab: Recent Activity */}
      {tab === 'activity' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-4">Latest pipeline actions across all robots</p>
          {recentActivity.length === 0 ? (
            <div className="rounded-lg border border-[#222] bg-[#161616] p-8 text-center text-gray-400">
              No recent activity.
            </div>
          ) : (
            recentActivity.map(entry => {
              const pipeline = pipelines.find(p => p.id === entry.pipeline_id);
              return (
                <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#161616] p-3 hover:border-[#333] transition">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                    entry.action === 'approve' ? 'bg-green-400' :
                    entry.action === 'reject' ? 'bg-red-400' :
                    entry.action === 'enter' ? 'bg-[#239eab]' :
                    entry.action === 'auto_collect' ? 'bg-purple-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pipeline && (
                        <a href={`/admin/pipeline/${pipeline.id}`} className="text-sm font-medium text-white hover:text-[#239eab] transition">
                          {pipeline.robots?.name || `Pipeline #${entry.pipeline_id}`}
                        </a>
                      )}
                      <span className="text-sm text-gray-400">
                        {steps.find(s => s.key === entry.step)?.name || entry.step}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                        entry.action === 'approve' ? 'bg-green-900/40 text-green-300' :
                        entry.action === 'reject' ? 'bg-red-900/40 text-red-300' :
                        entry.action === 'auto_collect' ? 'bg-purple-900/40 text-purple-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {entry.action}
                      </span>
                    </div>
                    {entry.comment && <p className="text-xs text-gray-400 mt-0.5">{entry.comment}</p>}
                    <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-2">
                      <span>{timeAgo(entry.created_at)}</span>
                      {entry.performed_by && <span>by {entry.performed_by}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: All Robots */}
      {tab === 'robots' && (
        <div className="grid gap-2">
          {robots.map(r => {
            const pipeline = pipelines.find(p => p.robot_id === r.id);
            return (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#161616] p-3 hover:border-[#333] transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">#{r.id}</span>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-gray-400">{r.status}</span>
                </div>
                {pipeline ? (
                  <a href={`/admin/pipeline/${pipeline.id}`} className="text-xs text-[#239eab] hover:underline transition">
                    {getStepName(pipeline.current_step)} →
                  </a>
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
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#161616] p-3 hover:border-[#333] transition">
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
                <div>{s.last_searched_at ? `${timeAgo(s.last_searched_at)}` : 'Never searched'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
