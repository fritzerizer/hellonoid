import type { Metadata } from "next";
import { Poppins } from 'next/font/google';
import WorkingNavbar from '@/components/WorkingNavbar';
import "./globals.css";

const poppins = Poppins({ subsets: ['latin', 'latin-ext'], variable: '--font-poppins', weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: "Hellonoid — Humanoid Robot Database",
  description: "The comprehensive database for humanoid robots. Specs, comparisons, news, and more.",
  keywords: ["humanoid robots", "robot specs", "robot comparison", "Tesla Optimus", "Figure AI", "Boston Dynamics Atlas"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="/fonts/fontawesome/all.min.css" />
      </head>
      <body className={`min-h-screen antialiased ${poppins.variable} font-sans`}>
        <WorkingNavbar />
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
