import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
/* eslint-disable @next/next/no-img-element */
import "./globals.css";

// Importera Font Awesome-setup
import '@/lib/fontawesome';

const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: "Hellonoid — Humanoid Robot Database",
  description: "The comprehensive database for humanoid robots. Specs, comparisons, news, and more.",
  keywords: ["humanoid robots", "robot specs", "robot comparison", "Tesla Optimus", "Figure AI", "Boston Dynamics Atlas"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen antialiased ${poppins.variable} font-sans`}>
        <nav className="sticky top-0 z-50 border-b border-[#27272a] bg-[#0c0c0d]/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight font-display">
              <img src="/logo.svg" alt="Hellonoid" className="h-10 w-auto max-w-[200px]" />
            </a>
            <div className="flex items-center gap-6 text-sm text-[#a0a0a0]">
              <a href="/robots" className="transition hover:text-white">Robots</a>
              <a href="/compare" className="transition hover:text-white">Compare</a>
              <a href="/news" className="transition hover:text-white">News</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-[#27272a] py-8 text-center text-sm text-[#71717a]">
          <div className="mx-auto max-w-7xl px-4">
            © {new Date().getFullYear()} hellonoid.com — The humanoid robot database
          </div>
        </footer>
      </body>
    </html>
  );
}
