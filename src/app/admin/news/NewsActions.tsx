'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/Icon';

export function NewsActions({
  articleId,
  currentStatus,
}: {
  articleId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: articleId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Could not update status');
    } finally {
      setLoading(null);
    }
  }

  const buttons: { status: string; label: string; icon: string; color: string }[] = [];

  if (currentStatus === 'draft') {
    buttons.push(
      { status: 'approved', label: 'Approve', icon: 'check', color: 'bg-green-600 hover:bg-green-500' },
      { status: 'rejected', label: 'Reject', icon: 'ban', color: 'bg-red-600 hover:bg-red-500' },
    );
  }

  if (currentStatus === 'approved') {
    buttons.push(
      { status: 'published', label: 'Publish', icon: 'globe', color: 'bg-[#239eab] hover:bg-[#2bb8c4]' },
      { status: 'draft', label: 'Back to draft', icon: 'undo', color: 'bg-gray-600 hover:bg-gray-500' },
    );
  }

  if (currentStatus === 'rejected') {
    buttons.push(
      { status: 'draft', label: 'Reconsider', icon: 'undo', color: 'bg-gray-600 hover:bg-gray-500' },
    );
  }

  if (currentStatus === 'published') {
    buttons.push(
      { status: 'draft', label: 'Unpublish', icon: 'eye-slash', color: 'bg-gray-600 hover:bg-gray-500' },
    );
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {buttons.map(btn => (
        <button
          key={btn.status}
          onClick={() => updateStatus(btn.status)}
          disabled={loading !== null}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors ${btn.color} disabled:opacity-50`}
        >
          {loading === btn.status ? (
            <Icon name="spinner" spin className="text-white" />
          ) : (
            <Icon name={btn.icon} className="text-white" />
          )}
          {btn.label}
        </button>
      ))}
    </div>
  );
}
