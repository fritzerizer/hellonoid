'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const publicLinks = [
  { href: '/robots', label: 'Robots' },
  { href: '/compare', label: 'Compare' },
  { href: '/news', label: 'News' },
];

const adminRobotLinks = [
  { href: '/admin/robots', label: 'Manage Robots' },
  { href: '/admin/pipeline', label: 'Asset Pipeline' },
  { href: '/admin/pipeline/about', label: 'Pipeline Info' },
];

export default function SimpleAuthNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [robotsDropdown, setRobotsDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user and check if admin
    async function checkUser() {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        console.log('Auth user check:', { authUser, error });
        
        if (error || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // For Fredrik's email, assume admin for now
        if (authUser.email === 'f.linder@me.com') {
          setUser({
            email: authUser.email,
            role: 'admin'
          });
        } else {
          // Check admin_users table
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', authUser.email)
            .single();

          if (adminUser) {
            setUser({
              email: authUser.email,
              role: adminUser.role
            });
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error checking user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (!session) {
          setUser(null);
        } else {
          checkUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setRobotsDropdown(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRobotsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href;
  const isRobotsActive = pathname.startsWith('/admin/robots') || pathname.startsWith('/admin/pipeline');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  console.log('SimpleAuthNavbar - user:', user, 'loading:', loading);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-[#27272a] bg-[#0c0c0d]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <img src="/logo.svg" alt="Hellonoid" className="h-10 w-auto max-w-[200px]" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[#a0a0a0]">
          {publicLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-white ${isActive(link.href) ? 'text-white' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <>
              <span className="text-[#333] select-none">|</span>
              <Link
                href="/admin"
                className={`transition hover:text-white ${isActive('/admin') ? 'text-[#239eab]' : 'text-[#239eab]/70'}`}
              >
                Dashboard
              </Link>

              {/* Robots dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setRobotsDropdown(prev => !prev)}
                  className={`flex items-center gap-1 transition hover:text-white ${isRobotsActive ? 'text-[#239eab]' : 'text-[#239eab]/70'}`}
                >
                  Robots
                  <svg className={`w-3 h-3 transition ${robotsDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {robotsDropdown && (
                  <div className="absolute top-full mt-2 right-0 min-w-[180px] rounded-lg border border-[#27272a] bg-[#161616] py-1 shadow-xl">
                    {adminRobotLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 text-sm transition ${
                          isActive(link.href) ? 'bg-[#239eab]/10 text-[#239eab]' : 'text-gray-300 hover:bg-[#1a1a1d] hover:text-white'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/admin/news"
                className={`transition hover:text-white ${isActive('/admin/news') ? 'text-[#239eab]' : 'text-[#239eab]/70'}`}
              >
                News
              </Link>

              {/* User info */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">{user.email}</span>
                <span className="bg-[#239eab]/20 text-[#239eab] px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {user.role}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white transition"
                >
                  Sign out
                </button>
              </div>
            </>
          )}

          {!user && !loading && (
            <Link href="/login" className="transition hover:text-white opacity-75 hover:opacity-100">
              Sign in
            </Link>
          )}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0 scale-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ${
          menuOpen ? 'max-h-[500px] border-t border-[#27272a]' : 'max-h-0'
        } bg-[#0c0c0d]/95 backdrop-blur-md`}
      >
        <div className="px-4 py-4 space-y-1">
          {publicLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-3 rounded-md text-base transition ${
                isActive(link.href) ? 'bg-[#239eab]/20 text-white' : 'text-[#a0a0a0] hover:bg-[#1a1a1d] hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-[#27272a] my-2" />
              <p className="px-3 py-1 text-xs text-[#555] uppercase tracking-wider">Admin</p>
              <Link
                href="/admin"
                className={`block px-3 py-3 rounded-md text-base transition ${
                  isActive('/admin') ? 'bg-[#239eab]/20 text-[#239eab]' : 'text-[#239eab]/70 hover:bg-[#1a1a1d] hover:text-[#239eab]'
                }`}
              >
                Dashboard
              </Link>

              <p className="px-3 pt-2 pb-1 text-xs text-[#444] uppercase tracking-wider">Robots</p>
              {adminRobotLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-3 pl-6 rounded-md text-base transition ${
                    isActive(link.href) ? 'bg-[#239eab]/20 text-[#239eab]' : 'text-[#239eab]/70 hover:bg-[#1a1a1d] hover:text-[#239eab]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/admin/news"
                className={`block px-3 py-3 rounded-md text-base transition ${
                  isActive('/admin/news') ? 'bg-[#239eab]/20 text-[#239eab]' : 'text-[#239eab]/70 hover:bg-[#1a1a1d] hover:text-[#239eab]'
                }`}
              >
                News
              </Link>

              <div className="border-t border-[#27272a] my-2" />
              <div className="px-3 py-1">
                <p className="text-xs text-[#555] truncate">{user.email}</p>
                <p className="text-xs text-[#239eab]">{user.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-3 rounded-md text-base text-gray-400 hover:bg-[#1a1a1d] hover:text-white transition"
              >
                Sign out
              </button>
            </>
          )}

          {!user && !loading && (
            <>
              <div className="border-t border-[#27272a] my-2" />
              <Link
                href="/login"
                className="block px-3 py-3 rounded-md text-base text-[#a0a0a0] hover:bg-[#1a1a1d] hover:text-white transition"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}