'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Icon from '@/components/Icon';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    robotCount: 0,
    newsCount: 0,
    user: null as any,
    loading: true
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // No auth - redirect to login
          window.location.href = '/login';
          return;
        }

        // Check if admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (!adminUser && session.user.email !== 'f.linder@me.com') {
          // Not an admin - redirect to login
          window.location.href = '/login';
          return;
        }

        // Get stats
        const [robotsResult, newsResult] = await Promise.all([
          supabase.from('robots').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          robotCount: robotsResult.count || 0,
          newsCount: newsResult.count || 0,
          user: session.user,
          loading: false
        });
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    loadData();
  }, []);

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0d] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#239eab] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, {stats.user?.email}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Robots</p>
                <p className="text-2xl font-bold">{stats.robotCount}</p>
              </div>
              <Icon name="robot" className="w-8 h-8 text-[#239eab]" />
            </div>
          </div>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">News Articles</p>
                <p className="text-2xl font-bold">{stats.newsCount}</p>
              </div>
              <Icon name="newspaper" className="w-8 h-8 text-[#239eab]" />
            </div>
          </div>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Last Update</p>
                <p className="text-sm font-medium">Just now</p>
              </div>
              <Icon name="clock" className="w-8 h-8 text-[#239eab]" />
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/admin/robots" 
            className="bg-[#161616] rounded-lg p-6 border border-[#27272a] hover:border-[#239eab] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon name="robot" className="w-6 h-6 text-[#239eab]" />
              <h3 className="text-lg font-semibold group-hover:text-[#239eab] transition-colors">
                Manage Robots
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Add, edit, and manage robot entries in the database
            </p>
          </Link>

          <Link 
            href="/admin/pipeline" 
            className="bg-[#161616] rounded-lg p-6 border border-[#27272a] hover:border-[#239eab] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon name="workflow" className="w-6 h-6 text-[#239eab]" />
              <h3 className="text-lg font-semibold group-hover:text-[#239eab] transition-colors">
                Asset Pipeline
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              19-step workflow from research to web-ready assets
            </p>
          </Link>

          <Link 
            href="/admin/news" 
            className="bg-[#161616] rounded-lg p-6 border border-[#27272a] hover:border-[#239eab] transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon name="newspaper" className="w-6 h-6 text-[#239eab]" />
              <h3 className="text-lg font-semibold group-hover:text-[#239eab] transition-colors">
                News Management
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Create and manage news articles and announcements
            </p>
          </Link>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a] opacity-50">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="chart" className="w-6 h-6 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-500">
                Analytics
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Coming soon - traffic and engagement metrics
            </p>
          </div>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a] opacity-50">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="users" className="w-6 h-6 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-500">
                User Management
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Coming soon - admin user roles and permissions
            </p>
          </div>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a] opacity-50">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="cog" className="w-6 h-6 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-500">
                Settings
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Coming soon - site configuration and preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}