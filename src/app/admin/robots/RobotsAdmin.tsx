'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faPlus, faPenToSquare, faTrash, faMagnifyingGlass,
  faFloppyDisk, faXmark, faImage, faBuilding, faGlobe, faSpinner, faCheck
} from '@fortawesome/free-solid-svg-icons';

interface Robot {
  id: number;
  name: string;
  slug: string;
  manufacturer_id: number | null;
  status: string | null;
  category: string | null;
  hero_image_url: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  manufacturers?: { name: string } | null;
}

interface Manufacturer {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  initialRobots: Robot[];
  manufacturers: Manufacturer[];
}

const STATUS_OPTIONS = ['announced', 'prototype', 'production', 'discontinued'];
const CATEGORY_OPTIONS = ['general-purpose', 'industrial', 'research', 'companion', 'military', 'medical'];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function RobotsAdmin({ initialRobots, manufacturers }: Props) {
  const [robots, setRobots] = useState<Robot[]>(initialRobots);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Robot | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    manufacturer_id: '',
    status: 'announced',
    category: 'general-purpose',
    hero_image_url: '',
    summary: '',
  });

  const filtered = robots.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.manufacturers?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setForm({ name: '', slug: '', manufacturer_id: '', status: 'announced', category: 'general-purpose', hero_image_url: '', summary: '' });
    setEditing(null);
    setShowForm(false);
  }

  function openNew() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(robot: Robot) {
    setForm({
      name: robot.name,
      slug: robot.slug,
      manufacturer_id: robot.manufacturer_id?.toString() || '',
      status: robot.status || 'announced',
      category: robot.category || 'general-purpose',
      hero_image_url: robot.hero_image_url || '',
      summary: robot.summary || '',
    });
    setEditing(robot);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      manufacturer_id: form.manufacturer_id ? parseInt(form.manufacturer_id) : null,
      status: form.status,
      category: form.category,
      hero_image_url: form.hero_image_url.trim() || null,
      summary: form.summary.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase
        .from('robots')
        .update(payload)
        .eq('id', editing.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `${payload.name} updated` });
        resetForm();
        router.refresh();
        // Refresh data
        const { data } = await supabase.from('robots').select('*, manufacturers(name)').order('created_at', { ascending: false });
        if (data) setRobots(data);
      }
    } else {
      const { error } = await supabase
        .from('robots')
        .insert({ ...payload, created_at: new Date().toISOString() });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `${payload.name} added` });
        resetForm();
        router.refresh();
        const { data } = await supabase.from('robots').select('*, manufacturers(name)').order('created_at', { ascending: false });
        if (data) setRobots(data);
      }
    }
    setSaving(false);
  }

  async function handleDelete(robot: Robot) {
    if (!confirm(`Delete ${robot.name}?`)) return;
    setDeleting(robot.id);
    const supabase = createClient();

    // Delete specs first
    await supabase.from('robot_specs').delete().eq('robot_id', robot.id);
    const { error } = await supabase.from('robots').delete().eq('id', robot.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setRobots(prev => prev.filter(r => r.id !== robot.id));
      setMessage({ type: 'success', text: `${robot.name} deleted` });
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faRobot} className="text-[#239eab]" />
            Robots
          </h1>
          <p className="mt-1 text-gray-400">{robots.length} robots in database</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#239eab] text-white rounded-lg hover:bg-[#1a8a96] transition font-medium"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add robot
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'
        }`}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faXmark} />
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {editing ? 'Edit robot' : 'Add new robot'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }));
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
                placeholder="Tesla Optimus Gen 3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
                placeholder="tesla-optimus-gen-3"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <FontAwesomeIcon icon={faBuilding} className="mr-1" /> Manufacturer
              </label>
              <select
                value={form.manufacturer_id}
                onChange={e => setForm(f => ({ ...f, manufacturer_id: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
              >
                <option value="">— Select —</option>
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <FontAwesomeIcon icon={faGlobe} className="mr-1" /> Category
              </label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <FontAwesomeIcon icon={faImage} className="mr-1" /> Hero image URL
              </label>
              <input
                type="text"
                value={form.hero_image_url}
                onChange={e => setForm(f => ({ ...f, hero_image_url: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Summary</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#239eab]"
              placeholder="A brief description of the robot..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#239eab] text-white rounded-lg hover:bg-[#1a8a96] transition font-medium disabled:opacity-50"
            >
              <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#239eab]"
          placeholder="Search robots..."
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <FontAwesomeIcon icon={faRobot} className="text-gray-600 text-5xl mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {robots.length === 0 ? 'No robots yet' : 'No results'}
          </h3>
          <p className="text-gray-400">
            {robots.length === 0 ? 'Click "Add robot" to get started.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden md:table-cell">Manufacturer</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Category</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(robot => (
                  <tr key={robot.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {robot.hero_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={robot.hero_image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                            <FontAwesomeIcon icon={faRobot} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{robot.name}</p>
                          <p className="text-xs text-gray-500 md:hidden">{robot.manufacturers?.name || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                      {robot.manufacturers?.name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        robot.status === 'production' ? 'bg-green-900/50 text-green-300' :
                        robot.status === 'prototype' ? 'bg-yellow-900/50 text-yellow-300' :
                        robot.status === 'announced' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {robot.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {robot.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(robot)}
                          className="p-2 text-gray-400 hover:text-[#239eab] transition"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDelete(robot)}
                          disabled={deleting === robot.id}
                          className="p-2 text-gray-400 hover:text-red-400 transition disabled:opacity-50"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={deleting === robot.id ? faSpinner : faTrash} className={deleting === robot.id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
