'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminSidebarProps {
  user: User;
  profile: any;
}

export default function AdminSidebar({ user, profile }: AdminSidebarProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
    },
    {
      name: 'Robots',
      href: '/admin/robots',
      icon: '🤖',
    },
    {
      name: 'News',
      href: '/admin/news',
      icon: '📰',
    },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800">
      <div className="flex flex-col h-full">
        {/* Logotyp */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
          <Link href="/" className="text-xl font-bold text-white">
            hellonoid<span className="text-[#239eab]">.</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#239eab] text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Användare och logout */}
        <div className="px-4 py-6 border-t border-gray-800">
          <div className="mb-4">
            <p className="text-sm text-gray-400">Inloggad som:</p>
            <p className="text-sm font-medium text-white truncate">
              {profile?.email || user.email}
            </p>
            {profile?.role && (
              <p className="text-xs text-[#239eab] uppercase tracking-wide">
                {profile.role}
              </p>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors disabled:opacity-50"
          >
            <span className="mr-3">🚪</span>
            {loading ? 'Loggar ut...' : 'Logga ut'}
          </button>
        </div>
      </div>
    </div>
  );
}