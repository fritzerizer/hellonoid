'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userEmail?: string;
}

const publicLinks = [
  { href: '/robots', label: 'Robots' },
  { href: '/compare', label: 'Compare' },
  { href: '/news', label: 'News' },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/robots', label: 'Manage Robots' },
  { href: '/admin/news', label: 'Manage News' },
];

export default function Navbar({ isLoggedIn, isAdmin, userEmail }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on click outside entire nav
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href;

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-[#27272a] bg-[#0c0c0d]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {isAdmin && (
            <>
              <span className="text-[#333] select-none">|</span>
              {adminLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition hover:text-white ${isActive(link.href) ? 'text-[#239eab]' : 'text-[#239eab]/70'}`}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}

          {!isLoggedIn && (
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

          {isAdmin && (
            <>
              <div className="border-t border-[#27272a] my-2" />
              <p className="px-3 py-1 text-xs text-[#555] uppercase tracking-wider">Admin</p>
              {adminLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-3 rounded-md text-base transition ${
                    isActive(link.href) ? 'bg-[#239eab]/20 text-[#239eab]' : 'text-[#239eab]/70 hover:bg-[#1a1a1d] hover:text-[#239eab]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[#27272a] my-2" />
              <p className="px-3 py-1 text-xs text-[#555] truncate">{userEmail}</p>
            </>
          )}

          {!isLoggedIn && (
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
