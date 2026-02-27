import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import Figure03Viewer from './Figure03Viewer';

export const metadata = {
  title: 'Figure 03 — 3D Model | Hellonoid',
  description: 'Interactive 3D model of the Figure 03 humanoid robot.',
};

export default function Figure03Page() {
  return (
    <div className="min-h-screen bg-[#0c0c0d]">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4">
        <div className="flex items-center gap-2 text-sm text-[#666] mb-4">
          <a href="/robots" className="hover:text-white transition">Robots</a>
          <span>›</span>
          <span className="text-[#a0a0a0]">Figure 03</span>
          <span>›</span>
          <span className="text-[#239eab]">3D Model</span>
        </div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FontAwesomeIcon icon={faRobot} className="text-[#239eab]" />
          Figure 03
        </h1>
        <p className="mt-2 text-gray-400">
          Interactive 3D model — drag to rotate, scroll to zoom, two fingers to pan
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <div className="relative w-full rounded-2xl border border-[#222] bg-gradient-to-b from-[#1a1a1d] to-[#111] overflow-hidden" style={{ height: '70vh' }}>
          <Figure03Viewer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
            <p className="text-sm text-gray-400">Manufacturer</p>
            <p className="text-lg font-semibold text-white">Figure AI</p>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-lg font-semibold text-[#239eab]">Development</p>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#161616] p-4">
            <p className="text-sm text-gray-400">3D Model</p>
            <p className="text-lg font-semibold text-white">100k polygons</p>
          </div>
        </div>
      </div>
    </div>
  );
}
