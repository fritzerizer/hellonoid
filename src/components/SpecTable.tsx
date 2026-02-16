import { RobotSpec } from '@/data/robots';

const categoryLabels: Record<string, string> = {
  dimensions: '📐 Dimensions',
  performance: '⚡ Performance',
  sensors: '👁️ Sensors',
  battery: '🔋 Battery & Power',
  actuators: '🦾 Actuators',
  general: '📋 General',
};

const categoryOrder = ['dimensions', 'performance', 'actuators', 'battery', 'sensors', 'general'];

export default function SpecTable({ specs }: { specs: RobotSpec[] }) {
  const grouped: Record<string, RobotSpec[]> = {};
  for (const spec of specs) {
    if (!grouped[spec.spec_category]) grouped[spec.spec_category] = [];
    grouped[spec.spec_category].push(spec);
  }

  return (
    <div className="space-y-4">
      {categoryOrder.filter(cat => grouped[cat]).map(cat => (
        <div key={cat} className="rounded-lg border border-[#222] bg-[#161616] overflow-hidden">
          <div className="border-b border-[#222] bg-[#111] px-4 py-2 text-sm font-medium text-[#a0a0a0]">
            {categoryLabels[cat] || cat}
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {grouped[cat].map(spec => (
              <div key={spec.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-[#a0a0a0]">{spec.spec_key}</span>
                <span className="font-medium text-white">
                  {spec.spec_value}{spec.spec_unit ? ` ${spec.spec_unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
