'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  completed_at: string | null;
  notes: string | null;
  robots?: { id: number; name: string; slug: string; status: string; hero_image_url: string };
}

interface Media {
  id: number;
  pipeline_id: number;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  media_type: string;
  view_angle: string | null;
  source_url: string | null;
  validation_status: string;
  validation_comment: string | null;
  validated_by: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

interface LogEntry {
  id: number;
  step: string;
  action: string;
  comment: string | null;
  performed_by: string | null;
  created_at: string;
}

interface Prompt {
  id: number;
  name: string;
  step: string;
  view_angle: string | null;
  prompt_template: string;
  is_default: boolean;
}

interface Adjustment {
  id: number;
  name: string;
  description: string | null;
  adjustment_type: string;
}

interface ExportConfig {
  id: number;
  name: string;
  format: string;
  width: number;
  height: number;
  transparent_bg: boolean;
  watermark: boolean;
}

interface Step {
  key: string;
  num: number;
  name: string;
  icon: string;
}

interface Props {
  pipeline: Pipeline;
  media: Media[];
  log: LogEntry[];
  prompts: Prompt[];
  adjustments: Adjustment[];
  exportConfigs: ExportConfig[];
  steps: readonly Step[];
}

const mediaTypeLabels: Record<string, string> = {
  reference: 'Reference',
  cropped: 'Cropped',
  rigged_view: 'Rigged View',
  upscaled: 'Upscaled',
  '3d_model': '3D Model',
  blender_file: 'Blender File',
  export: 'Export',
};

const viewAngleLabels: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left Side',
  right: 'Right Side',
  three_quarter_front: '¾ Front',
  top: 'Top',
  bottom: 'Bottom',
};

const REQUIRED_ANGLES = ['front', 'back', 'left', 'right'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

// ============= Toast System =============
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    info: 'bg-[#239eab]/90 border-[#239eab]',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-[60] rounded-lg border px-4 py-3 text-sm text-white shadow-xl backdrop-blur-sm transition-all animate-slide-up ${colors[type]}`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <Icon name="check-circle" />}
        {type === 'error' && <Icon name="exclamation-triangle" />}
        {type === 'info' && <Icon name="circle-info" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}

// ============= Confirmation Dialog =============
function ConfirmDialog({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, showInput, inputLabel, inputPlaceholder }: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && !e.shiftKey && !showInput) { e.preventDefault(); onConfirm(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, onConfirm, showInput]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl border border-[#333] bg-[#1a1a1d] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        {showInput && (
          <div className="mb-4">
            {inputLabel && <label className="block text-xs text-gray-400 mb-1">{inputLabel}</label>}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={inputPlaceholder || ''}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
              rows={2}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(inputValue || undefined)}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= Lightbox =============
function Lightbox({ src, alt, onClose, onPrev, onNext, sourceUrl }: {
  src: string; alt: string; onClose: () => void;
  onPrev?: () => void; onNext?: () => void; sourceUrl?: string | null;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition">
        ✕
      </button>
      {onPrev && (
        <button onClick={e => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition">
          ‹
        </button>
      )}
      {onNext && (
        <button onClick={e => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition">
          ›
        </button>
      )}
      <div className="flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#239eab] transition truncate max-w-[80vw]">
            Source: {sourceUrl}
          </a>
        )}
      </div>
    </div>
  );
}

// ============= Loading Spinner =============
function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <svg className={`animate-spin ${cls}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ============= Missing Angles Indicator =============
function MissingAngles({ media }: { media: Media[] }) {
  const approvedAngles = new Set(
    media
      .filter(m => m.validation_status === 'approved' && m.view_angle)
      .map(m => m.view_angle!)
  );
  const missing = REQUIRED_ANGLES.filter(a => !approvedAngles.has(a));
  const covered = REQUIRED_ANGLES.filter(a => approvedAngles.has(a));

  if (missing.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2">
        <Icon name="check-circle" /> All required angles covered (front, back, left, right)
      </div>
    );
  }

  return (
    <div className="text-xs bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-yellow-400 mb-1.5">
        <Icon name="exclamation-triangle" /> Missing angles:
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {REQUIRED_ANGLES.map(angle => {
          const has = covered.includes(angle);
          return (
            <span key={angle} className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              has ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
            }`}>
              {has ? '✓' : '✗'} {viewAngleLabels[angle] || angle}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============= Main Component =============
export default function PipelineDetail({ pipeline, media, log, prompts, adjustments, exportConfigs, steps }: Props) {
  const [activeTab, setActiveTab] = useState<'status' | 'media' | 'prompts' | 'adjustments' | 'log'>('status');
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [mediaList, setMediaList] = useState(media);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('reference');
  const [uploadAngle, setUploadAngle] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const dropRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const currentStepInfo = steps.find(s => s.key === pipeline.current_step);
  const currentStepNum = currentStepInfo?.num ?? 0;
  const progressPercent = Math.round((currentStepNum / steps.length) * 100);

  const [actionError, setActionError] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Drag and drop handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null || !dropRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
      }
    };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await handleUpload(files);
      }
    };

    const el = dropRef.current;
    if (el) {
      el.addEventListener('dragover', handleDragOver);
      el.addEventListener('dragleave', handleDragLeave);
      el.addEventListener('drop', handleDrop);
      return () => {
        el.removeEventListener('dragover', handleDragOver);
        el.removeEventListener('dragleave', handleDragLeave);
        el.removeEventListener('drop', handleDrop);
      };
    }
  }, [uploadType, uploadAngle]);

  async function doAction(action: string, targetStep?: string) {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/pipeline/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: pipeline.id,
          action,
          comment: comment || undefined,
          target_step: targetStep,
        }),
      });
      if (res.ok) {
        showToast(action === 'approve' ? 'Step approved! Moving to next step...' : action === 'reject' ? 'Sent back to earlier step' : 'Step skipped', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed (${res.status})`);
        showToast(data.error || 'Action failed', 'error');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error');
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleApprove() {
    doAction('approve');
  }

  function handleReject() {
    setConfirmDialog({
      title: 'Send Back',
      message: 'This will send the pipeline back to Collect Media (step 6). Are you sure?',
      confirmLabel: 'Send Back',
      confirmColor: 'bg-red-600 hover:bg-red-500',
      showInput: true,
      inputLabel: 'Reason (optional)',
      inputPlaceholder: 'Why are you sending this back?',
      onConfirm: (reason?: string) => {
        setConfirmDialog(null);
        if (reason) setComment(reason);
        doAction('reject', '06_collect_media');
      },
      onCancel: () => setConfirmDialog(null),
    });
  }

  const referenceMedia = mediaList.filter(m => m.media_type === 'reference');
  const riggedMedia = mediaList.filter(m => m.media_type === 'rigged_view');
  const exportMedia = mediaList.filter(m => m.media_type === 'export');
  const pendingMedia = mediaList.filter(m => m.validation_status === 'pending');

  // Filtered media for the media tab
  const filteredMedia = mediaList.filter(m => {
    if (mediaFilter !== 'all' && m.validation_status !== mediaFilter) return false;
    if (mediaTypeFilter !== 'all' && m.media_type !== mediaTypeFilter) return false;
    return true;
  });

  // Total media size
  const totalMediaSize = mediaList.reduce((sum, m) => sum + (m.file_size || 0), 0);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pipeline_id', String(pipeline.id));
        formData.append('media_type', uploadType);
        if (uploadAngle) formData.append('view_angle', uploadAngle);

        const res = await fetch('/api/admin/pipeline/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const newMedia = await res.json();
          setMediaList(prev => [newMedia, ...prev]);
          uploadedCount++;
        }
      }
      showToast(`Uploaded ${uploadedCount} file${uploadedCount !== 1 ? 's' : ''}`, 'success');
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  }

  const [collecting, setCollecting] = useState(false);
  const [collectResults, setCollectResults] = useState<any>(null);

  async function autoCollect() {
    setCollecting(true);
    setCollectResults(null);
    try {
      const res = await fetch('/api/admin/pipeline/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: pipeline.id, max_images: 12 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCollectResults({ error: `${data.error || 'Unknown error'} (HTTP ${res.status})` });
        showToast('Auto-collect failed', 'error');
        return;
      }
      setCollectResults(data);
      if (data.results) {
        for (const r of data.results) {
          if (r.success && r.media) {
            setMediaList(prev => [r.media, ...prev]);
          }
        }
      }
      showToast(`Collected ${data.collected} images`, 'success');
    } catch (err: any) {
      setCollectResults({ error: err.message });
      showToast('Auto-collect failed', 'error');
    } finally {
      setCollecting(false);
    }
  }

  const [generating, setGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<any[]>([]);

  async function generateViews(angle?: string) {
    setGenerating(true);
    setGenerateResults([]);
    try {
      const res = await fetch('/api/admin/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: pipeline.id, view_angle: angle }),
      });
      const data = await res.json();
      if (data.results) {
        setGenerateResults(data.results);
        for (const r of data.results) {
          if (r.success && r.media) {
            setMediaList(prev => [r.media, ...prev]);
          }
        }
        const successCount = data.results.filter((r: any) => r.success).length;
        showToast(`Generated ${successCount} view${successCount !== 1 ? 's' : ''}`, 'success');
      } else if (data.error) {
        setGenerateResults([{ error: data.error }]);
        showToast('Generation failed', 'error');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function validateMedia(mediaId: number, status: 'approved' | 'rejected', validationComment?: string) {
    const res = await fetch('/api/admin/pipeline/media/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId, status, comment: validationComment }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMediaList(prev => prev.map(m => m.id === mediaId ? { ...m, ...updated } : m));
      showToast(`Image ${status}`, status === 'approved' ? 'success' : 'info');
    } else {
      showToast('Validation failed', 'error');
    }
  }

  async function batchValidate(status: 'approved' | 'rejected') {
    if (selectedMediaIds.size === 0) return;
    
    const actionLabel = status === 'approved' ? 'approve' : 'reject';
    
    const doIt = async (comment?: string) => {
      setConfirmDialog(null);
      const res = await fetch('/api/admin/pipeline/media/batch-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_ids: Array.from(selectedMediaIds),
          status,
          comment: comment || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMediaList(prev => prev.map(m =>
          selectedMediaIds.has(m.id) ? { ...m, validation_status: status, validation_comment: comment || null } : m
        ));
        setSelectedMediaIds(new Set());
        showToast(`${data.updated} image${data.updated !== 1 ? 's' : ''} ${status}`, 'success');
      } else {
        showToast('Batch validation failed', 'error');
      }
    };

    if (status === 'rejected') {
      setConfirmDialog({
        title: `Reject ${selectedMediaIds.size} image${selectedMediaIds.size !== 1 ? 's' : ''}?`,
        message: 'These images will be marked as rejected.',
        confirmLabel: 'Reject All',
        confirmColor: 'bg-red-600 hover:bg-red-500',
        showInput: true,
        inputLabel: 'Reason',
        inputPlaceholder: 'Why are you rejecting these images?',
        onConfirm: doIt,
        onCancel: () => setConfirmDialog(null),
      });
    } else {
      doIt();
    }
  }

  function toggleMediaSelection(id: number) {
    setSelectedMediaIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllPending() {
    const pendingIds = mediaList.filter(m => m.validation_status === 'pending').map(m => m.id);
    setSelectedMediaIds(new Set(pendingIds));
  }

  // Lightbox navigation
  const lightboxMedia = mediaList.filter(m => m.file_url && m.mime_type?.startsWith('image'));
  function openLightbox(mediaId: number) {
    const idx = lightboxMedia.findIndex(m => m.id === mediaId);
    if (idx !== -1) setLightboxIndex(idx);
  }

  // Compute next action suggestion
  function getNextActionSuggestion(): string | null {
    const step = pipeline.current_step;
    if (step === '06_collect_media') {
      if (referenceMedia.length === 0) return 'Click "Auto-Collect Images" to search for reference photos';
      if (pendingMedia.length > 0) return `${pendingMedia.length} images awaiting validation. Approve & move to step 7 to validate.`;
      return 'Approve this step to proceed to validation';
    }
    if (step === '07_validate_media') {
      const pending = referenceMedia.filter(m => m.validation_status === 'pending');
      if (pending.length > 0) return `Review and approve/reject ${pending.length} pending image${pending.length !== 1 ? 's' : ''}`;
      const approved = referenceMedia.filter(m => m.validation_status === 'approved');
      if (approved.length === 0) return 'No approved images. Collect more or approve existing ones.';
      return 'All images reviewed. Approve this step to proceed to view generation.';
    }
    if (step === '08_generate_views') {
      if (riggedMedia.length === 0) return 'Click "Generate All Views" to create rigged images with AI';
      return 'Views generated. Review and approve to proceed.';
    }
    return null;
  }

  const nextAction = getNextActionSuggestion();

  // Time in current step
  const lastStepEntry = log.find(l => l.step === pipeline.current_step && l.action === 'enter');
  const timeInStep = lastStepEntry ? timeAgo(lastStepEntry.created_at) : null;

  return (
    <div ref={dropRef} className="relative">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxMedia[lightboxIndex] && (
        <Lightbox
          src={lightboxMedia[lightboxIndex].file_url}
          alt={lightboxMedia[lightboxIndex].file_name}
          sourceUrl={lightboxMedia[lightboxIndex].source_url}
          onClose={() => setLightboxIndex(null)}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
          onNext={lightboxIndex < lightboxMedia.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
        />
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#239eab]/10 backdrop-blur-sm border-4 border-dashed border-[#239eab] rounded-xl">
          <div className="text-center">
            <Icon name="cloud-arrow-up" className="text-5xl text-[#239eab] mb-2" />
            <div className="text-xl font-semibold text-[#239eab]">Drop files to upload</div>
            <div className="text-sm text-gray-400 mt-1">Images will be added as {mediaTypeLabels[uploadType] || uploadType}</div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-6 rounded-xl border border-[#239eab]/20 bg-gradient-to-r from-[#239eab]/5 to-transparent p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#239eab]">{progressPercent}%</span>
            <div>
              <div className="text-sm font-medium">Step {currentStepNum} of {steps.length}: {currentStepInfo?.name}</div>
              {timeInStep && <div className="text-xs text-gray-500">In this step since {timeInStep}</div>}
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
            pipeline.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            pipeline.status === 'completed' ? 'bg-blue-400/10 text-blue-400 border-blue-300/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>
            {pipeline.status}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#222]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#239eab] to-[#74deee] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Step progress */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-1 min-w-[900px]">
          {steps.map(step => {
            const isCurrent = step.key === pipeline.current_step;
            const isPast = step.num < currentStepNum;
            return (
              <div
                key={step.key}
                className={`flex-1 rounded-lg p-2 text-center transition ${
                  isCurrent
                    ? 'bg-[#239eab]/30 border-2 border-[#239eab] ring-2 ring-[#239eab]/20'
                    : isPast
                    ? 'bg-[#239eab]/10 border border-[#239eab]/20'
                    : 'bg-[#1a1a1d] border border-[#222]'
                }`}
              >
                <div className={`text-xs font-bold ${isCurrent ? 'text-[#239eab]' : isPast ? 'text-[#239eab]/60' : 'text-gray-500'}`}>
                  {isPast ? '✓' : step.num}
                </div>
                <div className={`text-[9px] mt-0.5 ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                  {step.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next action suggestion */}
      {nextAction && (
        <div className="mb-6 rounded-lg border border-[#239eab]/30 bg-[#239eab]/5 px-4 py-3 flex items-center gap-3">
          <Icon name="lightbulb" className="text-[#239eab] text-lg flex-shrink-0" />
          <span className="text-sm text-gray-300">{nextAction}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[#222] pb-2 overflow-x-auto">
        {([
          { key: 'status', label: 'Status & Actions', icon: 'gauge-high' },
          { key: 'media', label: `Media (${mediaList.length})`, icon: 'images' },
          { key: 'prompts', label: 'Prompts', icon: 'wand-magic-sparkles' },
          { key: 'adjustments', label: 'Adjustments', icon: 'sliders' },
          { key: 'log', label: 'History', icon: 'clock-rotate-left' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === t.key ? 'text-[#239eab] border-b-2 border-[#239eab]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Status */}
      {activeTab === 'status' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Current step info */}
            <div className="rounded-lg border border-[#239eab]/30 bg-[#239eab]/5 p-6">
              <h2 className="mb-2 text-lg font-semibold">
                Step {currentStepNum}: {currentStepInfo?.name}
              </h2>
              <p className="text-sm text-gray-400">
                {getStepDescription(pipeline.current_step)}
              </p>

              {/* Actions */}
              <div className="mt-4 space-y-3">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Comment (optional)..."
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-[#239eab] focus:ring-1 focus:ring-[#239eab] transition"
                  rows={2}
                />
                {actionError && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-2">
                    {actionError}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {loading ? <Spinner /> : <Icon name="check" />}
                    Approve & Next
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    <Icon name="rotate-left" /> Send Back
                  </button>
                  <button
                    onClick={() => doAction('skip')}
                    disabled={loading}
                    className="rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-collect images (step 6) */}
            {(pipeline.current_step === '06_collect_media' || pipeline.current_step === '07_validate_media') && (
              <div className="rounded-lg border border-[#333] bg-[#1a1a1d] p-4">
                <h3 className="mb-2 font-semibold text-sm flex items-center gap-2">
                  <Icon name="search" /> Auto-Collect Reference Images
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Searches Brave Image Search for high-res photos of {pipeline.robots?.name || 'the robot'} from multiple angles.
                  Filters out logos, icons, and diagrams automatically.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={autoCollect}
                    disabled={collecting}
                    className="rounded-md bg-[#239eab] px-4 py-1.5 text-sm text-white hover:bg-[#1e8a95] disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {collecting ? <><Spinner /> Searching &amp; downloading...</> : <><Icon name="magnifying-glass" /> Auto-Collect Images</>}
                  </button>
                  {referenceMedia.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {referenceMedia.length} reference image{referenceMedia.length !== 1 ? 's' : ''} collected
                    </span>
                  )}
                </div>

                {/* Collect results */}
                {collectResults && (
                  <div className="mt-3">
                    {collectResults.error ? (
                      <div className="text-sm text-red-400 bg-red-400/10 rounded-md p-2">{collectResults.error}</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-green-400">
                          Collected {collectResults.collected}/{collectResults.total_found} images
                        </div>
                        {/* Show queries used */}
                        {collectResults.queries_used && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-400">Queries used ({collectResults.queries_used.length})</summary>
                            <ul className="mt-1 space-y-0.5 pl-3">
                              {collectResults.queries_used.map((q: string, i: number) => (
                                <li key={i} className="text-gray-600">{q}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                        {/* Show collected with source URLs and sizes */}
                        {collectResults.results?.filter((r: any) => r.success).map((r: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-green-900/10 rounded px-2 py-1">
                            <span className="text-green-400">✓</span>
                            <span className="text-gray-400 truncate flex-1" title={r.source_url || r.url}>
                              {r.source_url ? new URL(r.source_url).hostname : 'unknown source'}
                            </span>
                            {r.file_size_formatted && (
                              <span className="text-gray-500 flex-shrink-0">{r.file_size_formatted}</span>
                            )}
                            {r.source_url && (
                              <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-[#239eab] hover:underline flex-shrink-0">
                                <Icon name="arrow-up-right-from-square" />
                              </a>
                            )}
                          </div>
                        ))}
                        {/* Show failures */}
                        {collectResults.results?.filter((r: any) => !r.success).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                              {collectResults.results.filter((r: any) => !r.success).length} skipped
                            </summary>
                            <div className="mt-1 space-y-0.5">
                              {collectResults.results.filter((r: any) => !r.success).map((r: any, i: number) => (
                                <div key={i} className="text-red-400/60 truncate pl-3">{r.error}</div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Inline upload */}
                <div className="mt-4 pt-3 border-t border-[#333]">
                  <p className="text-xs text-gray-500 mb-2">Or drag &amp; drop files here, or:</p>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600 transition flex items-center gap-1">
                      <Icon name="upload" /> Choose Files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                        disabled={uploading}
                      />
                    </label>
                    {uploading && <span className="text-xs text-gray-400 flex items-center gap-1"><Spinner /> Uploading...</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Inline media validation (step 7) */}
            {pipeline.current_step === '07_validate_media' && referenceMedia.length > 0 && (
              <div className="rounded-lg border border-[#333] bg-[#1a1a1d] p-4">
                <h3 className="mb-3 font-semibold text-sm flex items-center gap-2">
                  <Icon name="check-circle" /> Validate Reference Images
                </h3>

                {/* Missing angles indicator */}
                <div className="mb-3">
                  <MissingAngles media={referenceMedia} />
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Review each image. Select multiple to batch approve/reject. Click an image to enlarge.
                </p>

                {/* Batch actions */}
                {selectedMediaIds.size > 0 && (
                  <div className="mb-3 flex items-center gap-2 bg-[#239eab]/10 border border-[#239eab]/30 rounded-lg px-3 py-2">
                    <span className="text-xs text-[#239eab] font-medium">{selectedMediaIds.size} selected</span>
                    <button onClick={() => batchValidate('approved')} className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-500 transition">
                      Approve All
                    </button>
                    <button onClick={() => batchValidate('rejected')} className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500 transition">
                      Reject All
                    </button>
                    <button onClick={() => setSelectedMediaIds(new Set())} className="text-xs text-gray-400 hover:text-white ml-auto">
                      Clear
                    </button>
                  </div>
                )}
                {pendingMedia.length > 0 && selectedMediaIds.size === 0 && (
                  <button onClick={selectAllPending} className="mb-3 text-xs text-[#239eab] hover:underline">
                    Select all {pendingMedia.length} pending →
                  </button>
                )}

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {referenceMedia.map(m => (
                    <div
                      key={m.id}
                      className={`rounded-lg border overflow-hidden transition ${
                        selectedMediaIds.has(m.id)
                          ? 'border-[#239eab] ring-2 ring-[#239eab]/30 bg-[#239eab]/5'
                          : 'border-[#222] bg-[#161616]'
                      }`}
                    >
                      <div className="relative h-36 bg-[#111] flex items-center justify-center">
                        {m.file_url ? (
                          <img
                            src={m.file_url}
                            alt={m.file_name}
                            className="h-full w-full object-contain cursor-zoom-in"
                            onClick={() => openLightbox(m.id)}
                          />
                        ) : (
                          <div className="text-gray-500"><Icon name="image" /></div>
                        )}
                        {/* Selection checkbox */}
                        {m.validation_status === 'pending' && (
                          <button
                            onClick={() => toggleMediaSelection(m.id)}
                            className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition ${
                              selectedMediaIds.has(m.id)
                                ? 'bg-[#239eab] border-[#239eab] text-white'
                                : 'border-gray-500 bg-black/50 hover:border-[#239eab]'
                            }`}
                          >
                            {selectedMediaIds.has(m.id) && <span className="text-xs">✓</span>}
                          </button>
                        )}
                        {/* File size badge */}
                        {m.file_size && (
                          <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-gray-300">
                            {formatBytes(m.file_size)}
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-1.5">
                        <div className="text-xs truncate text-gray-300">{m.file_name}</div>
                        <div className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            m.validation_status === 'approved' ? 'bg-green-400' :
                            m.validation_status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                          <span className="text-[10px] text-gray-400">{m.validation_status}</span>
                          {m.view_angle && (
                            <span className="text-[10px] text-gray-500 ml-1">{viewAngleLabels[m.view_angle] || m.view_angle}</span>
                          )}
                        </div>
                        {/* Source URL */}
                        {m.source_url && (
                          <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                            className="block text-[9px] text-gray-600 hover:text-[#239eab] truncate transition" title={m.source_url}>
                            <Icon name="link" /> {(() => { try { return new URL(m.source_url).hostname; } catch { return 'source'; } })()}
                          </a>
                        )}
                        {m.validation_status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => validateMedia(m.id, 'approved')}
                              className="flex-1 rounded bg-green-900/40 px-2 py-1 text-[10px] text-green-300 hover:bg-green-800 transition"
                            >
                              <Icon name="check" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  title: 'Reject Image',
                                  message: `Reject "${m.file_name}"?`,
                                  confirmLabel: 'Reject',
                                  confirmColor: 'bg-red-600 hover:bg-red-500',
                                  showInput: true,
                                  inputLabel: 'Reason',
                                  inputPlaceholder: 'Why is this image not suitable?',
                                  onConfirm: (reason?: string) => { setConfirmDialog(null); validateMedia(m.id, 'rejected', reason); },
                                  onCancel: () => setConfirmDialog(null),
                                });
                              }}
                              className="flex-1 rounded bg-red-900/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-800 transition"
                            >
                              <Icon name="xmark" /> Reject
                            </button>
                          </div>
                        )}
                        {m.validation_comment && (
                          <div className="text-[10px] text-gray-500 italic">{m.validation_comment}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload more in step 7 */}
                <div className="mt-4 pt-3 border-t border-[#333]">
                  <p className="text-xs text-gray-500 mb-2">Need more images? Drag &amp; drop or:</p>
                  <label className="cursor-pointer rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600 transition inline-flex items-center gap-1">
                    <Icon name="upload" /> Upload More
                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
                  </label>
                </div>
              </div>
            )}

            {/* Generate views (step 8) */}
            {(pipeline.current_step === '08_generate_views' || pipeline.current_step === '06_collect_media' || pipeline.current_step === '07_validate_media') && (
              <div className="rounded-lg border border-[#333] bg-[#1a1a1d] p-4">
                <h3 className="mb-3 font-semibold text-sm">Generate Rigged Views (Gemini)</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Requires approved reference images. Generates images in 6 standard angles.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateViews()}
                    disabled={generating || referenceMedia.filter(m => m.validation_status === 'approved').length === 0}
                    className="rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {generating ? <><Spinner /> Generating...</> : 'Generate All Views'}
                  </button>
                  {['front', 'left', 'back', 'three_quarter_front'].map(angle => (
                    <button
                      key={angle}
                      onClick={() => generateViews(angle)}
                      disabled={generating}
                      className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition"
                    >
                      {viewAngleLabels[angle] || angle}
                    </button>
                  ))}
                </div>
                {generateResults.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {generateResults.map((r, i) => (
                      <div key={i} className={`text-xs ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                        {r.angle && `${viewAngleLabels[r.angle] || r.angle}: `}
                        {r.success ? '✅ Generated' : `❌ ${r.error}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meshy 3D Modeling (step 11) */}
            {['11_3d_modeling', '10_upscale_views', '09_validate_views'].includes(pipeline.current_step) && (
              <MeshyPanel
                pipelineId={pipeline.id}
                generations={pipeline.meshy_generations}
                maxGenerations={pipeline.max_generations}
                creditsUsed={pipeline.meshy_credits_used}
                onModelCreated={(m) => { setMediaList(prev => [m, ...prev]); showToast('3D model created!', 'success'); }}
              />
            )}

            {/* All collected media */}
            {mediaList.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Collected Media ({mediaList.length})</h3>
                  <label className="cursor-pointer rounded bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600 transition inline-flex items-center gap-1">
                    <Icon name="upload" /> Upload More
                    <input type="file" multiple accept="image/*,.glb,.gltf,.blend" className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {mediaList.map(m => (
                    <div key={m.id} className="relative rounded-lg border border-[#222] bg-[#161616] overflow-hidden group">
                      {m.file_url && m.mime_type?.startsWith('image') ? (
                        <img
                          src={m.file_url}
                          alt={m.file_name}
                          className="h-32 w-full object-cover cursor-zoom-in"
                          onClick={() => openLightbox(m.id)}
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center text-gray-500">
                          <Icon name="file" />
                        </div>
                      )}
                      {m.file_size && (
                        <span className="absolute top-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[8px] text-gray-300">
                          {formatBytes(m.file_size)}
                        </span>
                      )}
                      <div className="p-2">
                        <div className="text-xs font-medium truncate">{m.file_name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            m.validation_status === 'approved' ? 'bg-green-400' :
                            m.validation_status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                          <span className="text-[10px] text-gray-400">
                            {mediaTypeLabels[m.media_type] || m.media_type}
                            {m.view_angle && ` — ${viewAngleLabels[m.view_angle] || m.view_angle}`}
                          </span>
                        </div>
                        {m.source_url && (
                          <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                            className="block text-[8px] text-gray-600 hover:text-[#239eab] truncate mt-0.5">
                            <Icon name="link" /> source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg border border-[#222] bg-[#161616] p-4 space-y-3">
              <h3 className="font-semibold text-sm">Robot Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span>{pipeline.robots?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span>{pipeline.robots?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Height</span>
                  <span>
                    {pipeline.height_cm ? `${pipeline.height_cm} cm` : 'Unknown'}
                    {pipeline.height_cm && !pipeline.height_confirmed && ' ⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pipeline Version</span>
                  <span>v{pipeline.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Started</span>
                  <span className="text-xs">{new Date(pipeline.started_at).toLocaleDateString('sv-SE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meshy Generations</span>
                  <span>{pipeline.meshy_generations}/{pipeline.max_generations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meshy Credits</span>
                  <span>{pipeline.meshy_credits_used}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#161616] p-4 space-y-3">
              <h3 className="font-semibold text-sm">Media Overview</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference Images</span>
                  <span>{referenceMedia.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rigged Views</span>
                  <span>{riggedMedia.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exports</span>
                  <span>{exportMedia.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pending</span>
                  <span className={pendingMedia.length > 0 ? 'text-yellow-400' : ''}>{pendingMedia.length}</span>
                </div>
                <div className="flex justify-between border-t border-[#222] pt-1 mt-1">
                  <span className="text-gray-400">Total Size</span>
                  <span>{formatBytes(totalMediaSize)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#161616] p-4 space-y-3">
              <h3 className="font-semibold text-sm">Export Formats</h3>
              <div className="space-y-1 text-xs text-gray-400">
                {exportConfigs.map(c => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span>{c.width}x{c.height} {c.format.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Media */}
      {activeTab === 'media' && (
        <div>
          {/* Filters and bulk actions */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-400">Status:</label>
              <select value={mediaFilter} onChange={e => setMediaFilter(e.target.value as any)}
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white">
                <option value="all">All</option>
                <option value="pending">Pending ({mediaList.filter(m => m.validation_status === 'pending').length})</option>
                <option value="approved">Approved ({mediaList.filter(m => m.validation_status === 'approved').length})</option>
                <option value="rejected">Rejected ({mediaList.filter(m => m.validation_status === 'rejected').length})</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-400">Type:</label>
              <select value={mediaTypeFilter} onChange={e => setMediaTypeFilter(e.target.value)}
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white">
                <option value="all">All</option>
                {Object.entries(mediaTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v} ({mediaList.filter(m => m.media_type === k).length})</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500">
              {filteredMedia.length} of {mediaList.length} • {formatBytes(totalMediaSize)} total
            </div>
            <div className="flex-1" />
            {/* Bulk actions */}
            {pendingMedia.length > 0 && (
              <button
                onClick={async () => {
                  const pendingIds = mediaList.filter(m => m.validation_status === 'pending').map(m => m.id);
                  const res = await fetch('/api/admin/pipeline/media/batch-validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ media_ids: pendingIds, status: 'approved' }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMediaList(prev => prev.map(m => m.validation_status === 'pending' ? { ...m, validation_status: 'approved' } : m));
                    showToast(`Approved ${data.updated} pending images`, 'success');
                  }
                }}
                className="rounded bg-green-900/50 border border-green-700 px-3 py-1 text-xs text-green-300 hover:bg-green-800 transition"
              >
                <Icon name="check-double" /> Approve All Pending ({pendingMedia.length})
              </button>
            )}
          </div>

          {/* Upload area with drag & drop */}
          <div className={`mb-6 rounded-lg border-2 border-dashed p-6 transition ${
            isDragging ? 'border-[#239eab] bg-[#239eab]/10' : 'border-[#333] bg-[#161616]'
          }`}>
            <h3 className="mb-3 font-semibold text-sm">Upload Media</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select value={uploadType} onChange={e => setUploadType(e.target.value)}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white">
                  <option value="reference">Reference Image</option>
                  <option value="cropped">Cropped</option>
                  <option value="rigged_view">Rigged View</option>
                  <option value="3d_model">3D Model</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">View Angle</label>
                <select value={uploadAngle} onChange={e => setUploadAngle(e.target.value)}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white">
                  <option value="">Not specified</option>
                  {Object.entries(viewAngleLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <label className="cursor-pointer rounded-md bg-[#239eab] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1e8a95] transition inline-flex items-center gap-1">
                <Icon name="upload" /> {uploading ? <><Spinner /> Uploading...</> : 'Choose Files'}
                <input type="file" multiple accept="image/*,.glb,.gltf,.blend" className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Drag &amp; drop files here, or click to browse. Accepts JPG, PNG, WebP, GLB, GLTF, and Blender files.
            </p>
          </div>

          {/* Media grid */}
          {filteredMedia.length === 0 ? (
            <div className="rounded-lg border border-[#222] bg-[#161616] p-8 text-center text-gray-400">
              {mediaList.length === 0 ? 'No media files yet. Upload reference images to get started.' : 'No media matching current filters.'}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filteredMedia.map(m => (
                <div key={m.id} className="rounded-lg border border-[#222] bg-[#161616] overflow-hidden">
                  <div className="relative h-40 bg-[#111] flex items-center justify-center">
                    {m.file_url && m.mime_type?.startsWith('image') ? (
                      <img src={m.file_url} alt={m.file_name} className="h-full w-full object-contain cursor-zoom-in"
                        onClick={() => openLightbox(m.id)} />
                    ) : (
                      <div className="text-3xl text-gray-500"><Icon name="cube" /></div>
                    )}
                    {m.file_size && (
                      <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-gray-300">
                        {formatBytes(m.file_size)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-sm font-medium truncate">{m.file_name}</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">
                        {mediaTypeLabels[m.media_type] || m.media_type}
                      </span>
                      {m.view_angle && (
                        <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">
                          {viewAngleLabels[m.view_angle] || m.view_angle}
                        </span>
                      )}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                        m.validation_status === 'approved' ? 'bg-green-900/50 text-green-300' :
                        m.validation_status === 'rejected' ? 'bg-red-900/50 text-red-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {m.validation_status}
                      </span>
                    </div>
                    {m.width && m.height && (
                      <div className="text-[10px] text-gray-500">{m.width}×{m.height}px</div>
                    )}
                    {m.source_url && (
                      <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                        className="block text-[10px] text-gray-500 hover:text-[#239eab] truncate transition">
                        <Icon name="link" /> {(() => { try { return new URL(m.source_url).hostname; } catch { return m.source_url; } })()}
                      </a>
                    )}
                    {m.validation_comment && (
                      <div className="text-xs text-gray-400 italic">{m.validation_comment}</div>
                    )}
                    {m.validation_status === 'pending' && (
                      <div className="flex gap-1 pt-1">
                        <button onClick={() => validateMedia(m.id, 'approved')}
                          className="rounded bg-green-900/40 px-2 py-0.5 text-[10px] text-green-300 hover:bg-green-800 transition">
                          <Icon name="check" /> Approve
                        </button>
                        <button onClick={() => {
                          setConfirmDialog({
                            title: 'Reject Image',
                            message: `Reject "${m.file_name}"?`,
                            confirmLabel: 'Reject',
                            confirmColor: 'bg-red-600 hover:bg-red-500',
                            showInput: true, inputLabel: 'Reason', inputPlaceholder: 'Why?',
                            onConfirm: (r?: string) => { setConfirmDialog(null); validateMedia(m.id, 'rejected', r); },
                            onCancel: () => setConfirmDialog(null),
                          });
                        }} className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-800 transition">
                          <Icon name="xmark" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Prompts */}
      {activeTab === 'prompts' && (
        <div className="space-y-3">
          <h3 className="font-semibold mb-3">Image Generation Prompts (Step 8)</h3>
          {prompts.filter(p => p.step === '08_generate_views').map(p => (
            <div key={p.id} className="rounded-lg border border-[#222] bg-[#161616] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{p.name}</span>
                {p.view_angle && (
                  <span className="rounded bg-[#239eab]/20 px-2 py-0.5 text-xs text-[#239eab]">
                    {viewAngleLabels[p.view_angle] || p.view_angle}
                  </span>
                )}
              </div>
              <pre className="text-xs text-gray-400 whitespace-pre-wrap bg-[#111] rounded p-3">
                {p.prompt_template}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Adjustments */}
      {activeTab === 'adjustments' && (
        <div className="space-y-3">
          <h3 className="font-semibold mb-3">Blender Adjustments (Steps 14-15)</h3>
          {adjustments.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#161616] p-3">
              <div>
                <span className="font-medium text-sm">{a.name}</span>
                {a.description && <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>}
              </div>
              <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{a.adjustment_type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Log */}
      {activeTab === 'log' && (
        <div className="space-y-2">
          {log.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No history yet.</div>
          ) : (
            log.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  entry.action === 'approve' ? 'bg-green-400' :
                  entry.action === 'reject' ? 'bg-red-400' :
                  entry.action === 'enter' ? 'bg-[#239eab]' :
                  entry.action === 'auto_collect' ? 'bg-purple-400' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
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
                    {entry.performed_by && (
                      <span className="text-xs text-gray-500">by {entry.performed_by}</span>
                    )}
                  </div>
                  {entry.comment && (
                    <p className="text-xs text-gray-400 mt-0.5">{entry.comment}</p>
                  )}
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(entry.created_at).toLocaleString('sv-SE')} ({timeAgo(entry.created_at)})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Slide-up animation style */}
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

function MeshyPanel({ pipelineId, generations, maxGenerations, creditsUsed, onModelCreated }: {
  pipelineId: number;
  generations: number;
  maxGenerations: number;
  creditsUsed: number;
  onModelCreated: (media: any) => void;
}) {
  const [meshyTaskId, setMeshyTaskId] = useState<string | null>(null);
  const [meshyStatus, setMeshyStatus] = useState<string>('');
  const [meshyProgress, setMeshyProgress] = useState(0);
  const [meshyError, setMeshyError] = useState('');
  const [meshyLoading, setMeshyLoading] = useState(false);

  async function startMeshy() {
    setMeshyLoading(true);
    setMeshyError('');
    try {
      const res = await fetch('/api/admin/pipeline/meshy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: pipelineId, action: 'create' }),
      });
      const data = await res.json();
      if (data.task_id) {
        setMeshyTaskId(data.task_id);
        setMeshyStatus('PENDING');
        pollMeshy(data.task_id);
      } else {
        setMeshyError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setMeshyError(err.message);
    } finally {
      setMeshyLoading(false);
    }
  }

  async function pollMeshy(taskId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/pipeline/meshy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pipeline_id: pipelineId, action: 'status', task_id: taskId }),
        });
        const task = await res.json();
        setMeshyStatus(task.status || '');
        setMeshyProgress(task.progress || 0);

        if (task.status === 'SUCCEEDED') {
          clearInterval(interval);
          const dlRes = await fetch('/api/admin/pipeline/meshy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pipeline_id: pipelineId, action: 'download', task_id: taskId }),
          });
          const dlData = await dlRes.json();
          if (dlData.media) onModelCreated(dlData.media);
        } else if (task.status === 'FAILED') {
          clearInterval(interval);
          setMeshyError(task.task_error?.message || '3D generation failed');
        }
      } catch {
        clearInterval(interval);
      }
    }, 10000);
  }

  return (
    <div className="rounded-lg border border-[#333] bg-[#1a1a1d] p-4">
      <h3 className="mb-2 font-semibold text-sm">
        <Icon name="cube" /> 3D Modeling (Meshy.ai)
      </h3>
      <div className="mb-3 flex gap-4 text-xs text-gray-400">
        <span>Generations: {generations}/{maxGenerations}</span>
        <span>Credits: {creditsUsed}</span>
      </div>

      {meshyStatus && meshyStatus !== 'SUCCEEDED' && meshyStatus !== 'FAILED' && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-yellow-300 mb-1">
            <Spinner size="md" /> {meshyStatus} ({meshyProgress}%)
          </div>
          <div className="h-2 rounded-full bg-[#222]">
            <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${meshyProgress}%` }} />
          </div>
        </div>
      )}

      {meshyStatus === 'SUCCEEDED' && (
        <div className="mb-3 text-sm text-green-400">✅ 3D model created and downloaded!</div>
      )}

      {meshyError && (
        <div className="mb-3 text-sm text-red-400">❌ {meshyError}</div>
      )}

      <button
        onClick={startMeshy}
        disabled={meshyLoading || generations >= maxGenerations || (!!meshyStatus && meshyStatus !== 'SUCCEEDED' && meshyStatus !== 'FAILED')}
        className="rounded-md bg-orange-600 px-4 py-1.5 text-sm text-white hover:bg-orange-500 disabled:opacity-50 transition"
      >
        {meshyLoading ? 'Starting...' : generations >= maxGenerations ? 'Max generations reached' : 'Generate 3D Model'}
      </button>
      <p className="mt-2 text-[10px] text-gray-500">
        Uses approved front image. Costs ~30 credits (mesh + texture).
      </p>
    </div>
  );
}

function getStepDescription(step: string): string {
  const descriptions: Record<string, string> = {
    '01_research': 'Search for new robots on manufacturer sites, news outlets, and social media.',
    '02_duplicate_check': 'Verify the robot does not already exist in the database.',
    '03_create_robot': 'Create a robot entry in the database with basic information.',
    '04_create_storage': 'Create a storage folder for the robot\'s assets.',
    '05_create_subfolders': 'Create subfolders: raw materials, 3D model, export.',
    '06_collect_media': 'Collect images covering the entire robot. Front, back, sides in high resolution. Crop images to show only the robot.',
    '07_validate_media': 'Review and approve collected images. Are all angles covered? Is the resolution sufficient?',
    '08_generate_views': 'Generate rigged images in fixed angles using AI (Gemini). Front, side, back, three-quarter front, top, bottom.',
    '09_validate_views': 'Validate the generated views. If quality is insufficient, send back to step 6.',
    '10_upscale_views': 'Create high-resolution versions of each view separately.',
    '11_3d_modeling': 'Send materials to Meshy.ai for 3D model generation.',
    '12_validate_3d': 'Review the 3D model. Check proportions, details, and texture quality.',
    '13_import_blender': 'Import the 3D model into Blender for post-processing.',
    '14_auto_cleanup': 'Run automated Blender scripts to clean up and polish the model.',
    '15_manual_adjustments': 'Make manual adjustments as needed following instructions.',
    '16_validate_result': 'Final validation of the finished 3D model after all adjustments.',
    '17_export_web': 'Export images for the web. Proportional sizing, watermark, transparent background.',
    '18_upload': 'Upload the finished images to hellonoid.com.',
    '19_ready_to_publish': 'The robot is ready to publish with all images in place.',
  };
  return descriptions[step] || '';
}
