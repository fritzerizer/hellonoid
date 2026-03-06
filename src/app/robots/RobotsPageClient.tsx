'use client';

import { useState } from 'react';
import RobotCard from '@/components/RobotCard';
import type { Robot, Entity } from '@/data/robots';

interface Props {
  robots: Robot[];
  entities: Entity[];
}

export default function RobotsPageClient({ robots, entities }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const manufacturerEntities = entities.filter(e => e.entity_type === 'manufacturer');

  const filtered = robots.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (entityFilter !== 'all' && r.entity_id !== Number(entityFilter)) return false;
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
          className="rounded-lg border border-[#333] bg-[#161616] px-3 py-2 text-sm text-white outline-none focus:border-[#239eab]"
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="rounded-lg border border-[#333] bg-[#161616] px-3 py-2 text-sm text-white outline-none focus:border-[#239eab]"
        >
          <option value="all">All Manufacturers</option>
          {manufacturerEntities.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
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
