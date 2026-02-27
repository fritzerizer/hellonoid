import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
import "./globals.css";

import '@/lib/fontawesome';
import NavbarServer from '@/components/NavbarServer';

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
        <NavbarServer />
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
