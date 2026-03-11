import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0c0d]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </div>
    </div>
  );
}
