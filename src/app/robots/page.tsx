'use client';

import { useState } from 'react';
import RobotCard from '@/components/RobotCard';
import { robots, manufacturers } from '@/data/robots';

export default function RobotsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');

  const filtered = robots.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (manufacturerFilter !== 'all' && r.manufacturer_id !== Number(manufacturerFilter)) return false;
    return true;
  });

  const statuses = ['all', 'shipping', 'development', 'announced', 'discontinued'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">All Robots</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#333] bg-[#161616] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={manufacturerFilter}
          onChange={e => setManufacturerFilter(e.target.value)}
          className="rounded-lg border border-[#333] bg-[#161616] px-3 py-2 text-sm text-white outline-none focus:border-[#3b82f6]"
        >
          <option value="all">All Manufacturers</option>
          {manufacturers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="flex items-center text-sm text-[#666]">{filtered.length} robots</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(robot => (
          <RobotCard key={robot.id} robot={robot} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-[#666]">No robots match your filters.</div>
      )}
    </div>
  );
}
