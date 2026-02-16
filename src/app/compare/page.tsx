'use client';

import { useState } from 'react';
import { robots, manufacturers, robotSpecs } from '@/data/robots';

export default function ComparePage() {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedRobots = robots.filter(r => selected.includes(r.id));

  // Collect all unique spec keys across selected robots
  const allSpecKeys = Array.from(new Set(
    robotSpecs.filter(s => selected.includes(s.robot_id)).map(s => s.spec_key)
  ));

  const getSpec = (robotId: number, key: string) => {
    const s = robotSpecs.find(sp => sp.robot_id === robotId && sp.spec_key === key);
    return s ? `${s.spec_value}${s.spec_unit ? ` ${s.spec_unit}` : ''}` : '—';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Compare Robots</h1>
      <p className="mb-6 text-[#a0a0a0]">Select 2–4 robots to compare side by side.</p>

      {/* Robot selector */}
      <div className="mb-8 flex flex-wrap gap-2">
        {robots.map(r => {
          const isSelected = selected.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                isSelected
                  ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]'
                  : 'border-[#333] text-[#a0a0a0] hover:border-[#555] hover:text-white'
              } ${!isSelected && selected.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={!isSelected && selected.length >= 4}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      {selectedRobots.length >= 2 ? (
        <div className="overflow-x-auto rounded-lg border border-[#222]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] bg-[#111]">
                <th className="p-3 text-left text-[#666] font-medium w-40">Spec</th>
                {selectedRobots.map(r => (
                  <th key={r.id} className="p-3 text-left font-medium">
                    <a href={`/robots/${r.slug}`} className="text-[#3b82f6] hover:underline">{r.name}</a>
                    <div className="text-xs text-[#666] font-normal">{manufacturers.find(m => m.id === r.manufacturer_id)?.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              <tr className="bg-[#161616]">
                <td className="p-3 text-[#666]">Status</td>
                {selectedRobots.map(r => <td key={r.id} className="p-3 capitalize">{r.status}</td>)}
              </tr>
              <tr>
                <td className="p-3 text-[#666]">Category</td>
                {selectedRobots.map(r => <td key={r.id} className="p-3">{r.category}</td>)}
              </tr>
              {allSpecKeys.map((key, i) => (
                <tr key={key} className={i % 2 === 0 ? 'bg-[#161616]' : ''}>
                  <td className="p-3 text-[#666]">{key}</td>
                  {selectedRobots.map(r => (
                    <td key={r.id} className="p-3">{getSpec(r.id, key)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-[#222] bg-[#161616] py-20 text-center text-[#666]">
          {selected.length === 0 ? 'Select at least 2 robots to compare' : 'Select one more robot to compare'}
        </div>
      )}
    </div>
  );
}
