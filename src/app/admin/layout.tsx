import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Verifiera att användaren är inloggad
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Hämta användarens profil för att visa email
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0c0c0d]">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar user={user} profile={profile} />
        
        {/* Huvudinnehåll */}
        <div className="flex-1 ml-64">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}