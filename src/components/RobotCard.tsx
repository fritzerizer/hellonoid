import { Robot, manufacturers, robotSpecs } from '@/data/robots';

const statusColors: Record<string, string> = {
  shipping: 'bg-green-500/20 text-green-400 border-green-500/30',
  development: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  announced: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  discontinued: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function RobotCard({ robot }: { robot: Robot }) {
  const manufacturer = manufacturers.find(m => m.id === robot.manufacturer_id);
  const specs = robotSpecs.filter(s => s.robot_id === robot.id);
  const height = specs.find(s => s.spec_key === 'Height');
  const weight = specs.find(s => s.spec_key === 'Weight');

  return (
    <a
      href={`/robots/${robot.slug}`}
      className="group block rounded-lg border border-[#222] bg-[#161616] p-5 transition hover:border-[#3b82f6]/40 hover:bg-[#1a1a1a]"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white group-hover:text-[#3b82f6] transition">{robot.name}</h3>
          <p className="text-sm text-[#a0a0a0]">{manufacturer?.name}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[robot.status]}`}>
          {robot.status}
        </span>
      </div>
      <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-[#111] text-4xl text-[#333]">
        🤖
      </div>
      <p className="mb-3 text-sm text-[#a0a0a0] line-clamp-2">{robot.summary}</p>
      <div className="flex gap-4 text-xs text-[#666]">
        {height && <span>{height.spec_value} {height.spec_unit}</span>}
        {weight && <span>{weight.spec_value} {weight.spec_unit}</span>}
        <span className="text-[#555]">{robot.category}</span>
      </div>
    </a>
  );
}
