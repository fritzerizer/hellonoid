'use client';

import { useState } from 'react';
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
  mime_type: string | null;
  media_type: string;
  view_angle: string | null;
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
  reference: 'Referensbild',
  cropped: 'Beskuren',
  rigged_view: 'Riggad vy',
  upscaled: 'Uppskalad',
  '3d_model': '3D-modell',
  blender_file: 'Blender-fil',
  export: 'Export',
};

const viewAngleLabels: Record<string, string> = {
  front: 'Framifrån',
  back: 'Bakifrån',
  left: 'Vänster sida',
  right: 'Höger sida',
  three_quarter_front: 'Snett framifrån',
  top: 'Ovanifrån',
  bottom: 'Underifrån',
};

export default function PipelineDetail({ pipeline, media, log, prompts, adjustments, exportConfigs, steps }: Props) {
  const [activeTab, setActiveTab] = useState<'status' | 'media' | 'prompts' | 'adjustments' | 'log'>('status');
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [mediaList, setMediaList] = useState(media);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('reference');
  const [uploadAngle, setUploadAngle] = useState('');

  const currentStepInfo = steps.find(s => s.key === pipeline.current_step);
  const currentStepNum = currentStepInfo?.num ?? 0;

  async function doAction(action: string, targetStep?: string) {
    setLoading(true);
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
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  const referenceMedia = mediaList.filter(m => m.media_type === 'reference');
  const riggedMedia = mediaList.filter(m => m.media_type === 'rigged_view');
  const exportMedia = mediaList.filter(m => m.media_type === 'export');

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
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
        }
      }
    } finally {
      setUploading(false);
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
        // Add successful media to list
        for (const r of data.results) {
          if (r.success && r.media) {
            setMediaList(prev => [r.media, ...prev]);
          }
        }
      } else if (data.error) {
        setGenerateResults([{ error: data.error }]);
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
    }
  }

  return (
    <div>
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
                  {step.num}
                </div>
                <div className={`text-[9px] mt-0.5 ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                  {step.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[#222] pb-2">
        {([
          { key: 'status', label: 'Status & Åtgärder' },
          { key: 'media', label: `Media (${media.length})` },
          { key: 'prompts', label: 'Promptar' },
          { key: 'adjustments', label: 'Justeringar' },
          { key: 'log', label: 'Historik' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === t.key ? 'text-[#239eab] border-b-2 border-[#239eab]' : 'text-gray-400 hover:text-white'
            }`}
          >
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
                Steg {currentStepNum}: {currentStepInfo?.name}
              </h2>
              <p className="text-sm text-gray-400">
                {getStepDescription(pipeline.current_step)}
              </p>

              {/* Actions */}
              <div className="mt-4 space-y-3">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Kommentar (valfritt)..."
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction('approve')}
                    disabled={loading}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition"
                  >
                    <Icon name="check" /> Godkänn & gå vidare
                  </button>
                  <button
                    onClick={() => doAction('reject', '06_collect_media')}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition"
                  >
                    <Icon name="rotate-left" /> Skicka tillbaka
                  </button>
                  <button
                    onClick={() => doAction('skip')}
                    disabled={loading}
                    className="rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition"
                  >
                    Hoppa över
                  </button>
                </div>
              </div>
            </div>

            {/* Generate views (step 8) */}
            {(pipeline.current_step === '08_generate_views' || pipeline.current_step === '06_collect_media' || pipeline.current_step === '07_validate_media') && (
              <div className="rounded-lg border border-[#333] bg-[#1a1a1d] p-4">
                <h3 className="mb-3 font-semibold text-sm">Generera riggade vyer (Gemini)</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Kräver godkända referensbilder. Genererar bilder i 6 standardvinklar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => generateViews()}
                    disabled={generating || referenceMedia.filter(m => m.validation_status === 'approved').length === 0}
                    className="rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50 transition"
                  >
                    {generating ? 'Genererar...' : 'Generera alla vyer'}
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
                        {r.success ? '✅ Genererad' : `❌ ${r.error}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Media preview */}
            {mediaList.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold">Senaste media</h3>
                <div className="grid grid-cols-3 gap-2">
                  {mediaList.slice(0, 6).map(m => (
                    <div key={m.id} className="relative rounded-lg border border-[#222] bg-[#161616] overflow-hidden">
                      {m.file_url && m.mime_type?.startsWith('image') ? (
                        <img src={m.file_url} alt={m.file_name} className="h-32 w-full object-cover" />
                      ) : (
                        <div className="flex h-32 items-center justify-center text-gray-500">
                          <Icon name="file" />
                        </div>
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
              <h3 className="font-semibold text-sm">Robotinfo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Namn</span>
                  <span>{pipeline.robots?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span>{pipeline.robots?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Höjd</span>
                  <span>
                    {pipeline.height_cm ? `${pipeline.height_cm} cm` : 'Okänd'}
                    {pipeline.height_cm && !pipeline.height_confirmed && ' ⚠️'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pipeline-version</span>
                  <span>v{pipeline.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meshy-genereringar</span>
                  <span>{pipeline.meshy_generations}/{pipeline.max_generations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Meshy-credits</span>
                  <span>{pipeline.meshy_credits_used}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#161616] p-4 space-y-3">
              <h3 className="font-semibold text-sm">Media-översikt</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Referensbilder</span>
                  <span>{referenceMedia.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Riggade vyer</span>
                  <span>{riggedMedia.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exporter</span>
                  <span>{exportMedia.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#222] bg-[#161616] p-4 space-y-3">
              <h3 className="font-semibold text-sm">Exportformat</h3>
              <div className="space-y-1 text-xs text-gray-400">
                {exportConfigs.map(c => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span>{c.width}×{c.height} {c.format.toUpperCase()}</span>
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
          {/* Upload area */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-[#333] bg-[#161616] p-6">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Typ</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
                >
                  <option value="reference">Referensbild</option>
                  <option value="cropped">Beskuren</option>
                  <option value="rigged_view">Riggad vy</option>
                  <option value="3d_model">3D-modell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vinkel</label>
                <select
                  value={uploadAngle}
                  onChange={e => setUploadAngle(e.target.value)}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
                >
                  <option value="">Ingen specifik</option>
                  <option value="front">Framifrån</option>
                  <option value="back">Bakifrån</option>
                  <option value="left">Vänster sida</option>
                  <option value="right">Höger sida</option>
                  <option value="three_quarter_front">Snett framifrån</option>
                  <option value="top">Ovanifrån</option>
                  <option value="bottom">Underifrån</option>
                </select>
              </div>
              <label className="cursor-pointer rounded-md bg-[#239eab] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1e8a95] transition">
                <Icon name="upload" /> {uploading ? 'Laddar upp...' : 'Välj filer'}
                <input
                  type="file"
                  multiple
                  accept="image/*,.glb,.gltf,.blend"
                  className="hidden"
                  onChange={e => handleUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Media grid */}
          {mediaList.length === 0 ? (
            <div className="rounded-lg border border-[#222] bg-[#161616] p-8 text-center text-gray-400">
              Inga mediafiler ännu. Ladda upp referensbilder för att komma igång.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {mediaList.map(m => (
                <div key={m.id} className="rounded-lg border border-[#222] bg-[#161616] overflow-hidden">
                  <div className="h-40 bg-[#111] flex items-center justify-center">
                    {m.file_url && m.mime_type?.startsWith('image') ? (
                      <img src={m.file_url} alt={m.file_name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="text-3xl text-gray-500"><Icon name="cube" /></div>
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
                    {m.validation_comment && (
                      <div className="text-xs text-gray-400 italic">{m.validation_comment}</div>
                    )}
                    {/* Validation buttons */}
                    {m.validation_status === 'pending' && (
                      <div className="flex gap-1 pt-1">
                        <button
                          onClick={() => validateMedia(m.id, 'approved')}
                          className="rounded bg-green-900/40 px-2 py-0.5 text-[10px] text-green-300 hover:bg-green-800 transition"
                        >
                          <Icon name="check" /> Godkänn
                        </button>
                        <button
                          onClick={() => {
                            const c = prompt('Anledning:');
                            if (c) validateMedia(m.id, 'rejected', c);
                          }}
                          className="rounded bg-red-900/40 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-800 transition"
                        >
                          <Icon name="xmark" /> Avvisa
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
          <h3 className="font-semibold mb-3">Bildgenereringspromptar (steg 8)</h3>
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
          <h3 className="font-semibold mb-3">Blender-justeringar (steg 14-15)</h3>
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
            <div className="text-center text-gray-400 py-8">Ingen historik ännu.</div>
          ) : (
            log.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-[#222] bg-[#161616] p-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  entry.action === 'approve' ? 'bg-green-400' :
                  entry.action === 'reject' ? 'bg-red-400' :
                  entry.action === 'enter' ? 'bg-[#239eab]' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {steps.find(s => s.key === entry.step)?.name || entry.step}
                    </span>
                    <span className="text-xs text-gray-400">{entry.action}</span>
                    {entry.performed_by && (
                      <span className="text-xs text-gray-500">av {entry.performed_by}</span>
                    )}
                  </div>
                  {entry.comment && (
                    <p className="text-xs text-gray-400 mt-0.5">{entry.comment}</p>
                  )}
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(entry.created_at).toLocaleString('sv-SE')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getStepDescription(step: string): string {
  const descriptions: Record<string, string> = {
    '01_research': 'Sök efter nya robotar på tillverkarsidor, nyhetssidor och sociala medier.',
    '02_duplicate_check': 'Kontrollera att roboten inte redan finns i databasen.',
    '03_create_robot': 'Skapa robotpost i databasen med grundläggande information.',
    '04_create_storage': 'Skapa lagringsmapp för robotens tillgångar.',
    '05_create_subfolders': 'Skapa undermappar: råmaterial, 3D-modell, export.',
    '06_collect_media': 'Samla in bildmaterial som täcker hela roboten. Framsida, baksida, sidor i hög upplösning. Beskär bilder så bara roboten syns.',
    '07_validate_media': 'Granska och godkänn insamlat bildmaterial. Alla vinklar täckta? Tillräcklig upplösning?',
    '08_generate_views': 'Generera riggade bilder i fasta vinklar med AI (Gemini). Framifrån, sidan, bakifrån, snett framifrån, ovanifrån, underifrån.',
    '09_validate_views': 'Validera de genererade vyerna. Om kvaliteten inte räcker, skicka tillbaka till steg 6.',
    '10_upscale_views': 'Skapa högupplösta versioner av varje vy separat.',
    '11_3d_modeling': 'Skicka underlag till Meshy.ai för 3D-modellering.',
    '12_validate_3d': 'Granska 3D-modellen. Proportioner, detaljer, textur.',
    '13_import_blender': 'Importera 3D-modellen i Blender för efterbearbetning.',
    '14_auto_cleanup': 'Kör automatiska Blender-skript för att snygga till modellen.',
    '15_manual_adjustments': 'Gör manuella justeringar vid behov enligt instruktioner.',
    '16_validate_result': 'Slutgiltig validering av den färdiga 3D-modellen.',
    '17_export_web': 'Exportera bilder för webben. Proportionella storlekar, vattenstämpel, transparent bakgrund.',
    '18_upload': 'Ladda upp de färdiga bilderna på hellonoid.com.',
    '19_ready_to_publish': 'Roboten är redo att publiceras med alla bilder på plats.',
  };
  return descriptions[step] || '';
}
