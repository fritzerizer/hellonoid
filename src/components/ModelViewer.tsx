'use client';

import { useEffect, useRef } from 'react';

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
}

export default function ModelViewer({ src, alt = '3D Model', poster }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import model-viewer to avoid SSR issues
    import('@google/model-viewer');
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* @ts-expect-error - model-viewer is a web component */}
      <model-viewer
        src={src}
        alt={alt}
        poster={poster}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        shadow-softness="0.5"
        exposure="1"
        environment-image="neutral"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />
    </div>
  );
}
