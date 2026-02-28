'use client';

import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

export default function Figure03Viewer() {
  return (
    <ModelViewer
      src="/models/figure-03-v2.glb"
      alt="Figure 03 humanoid robot 3D model"
    />
  );
}
