'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

const MODELS = [
  { id: 'meshy', label: 'Meshy (4 images)', src: '/models/figure-03-v2.glb' },
  { id: 'tripo-extra', label: 'Tripo (extra images)', src: '/models/figure-03-tripo-extra.glb' },
  { id: 'tripo-multiview', label: 'Tripo (multiview)', src: '/models/figure-03-tripo-multiview.glb' },
];

export default function Figure03Viewer() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col h-full">
      {/* Model selector */}
      <div className="flex gap-2 p-3 bg-[#111] border-b border-[#222]">
        {MODELS.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              active === i
                ? 'bg-[#239eab] text-white'
                : 'bg-[#1a1a1d] text-[#888] hover:text-white hover:bg-[#222]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {/* Viewer */}
      <div className="flex-1">
        <ModelViewer
          src={MODELS[active].src}
          alt={`Figure 03 — ${MODELS[active].label}`}
        />
      </div>
    </div>
  );
}
