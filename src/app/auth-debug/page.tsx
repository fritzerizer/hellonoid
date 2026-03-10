'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, supabase } from '@/lib/working-auth';

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function gatherDebugInfo() {
      const info: any = {
        timestamp: new Date().toISOString(),
        localStorage: {},
        supabase: {},
        user: null,
      };

      // Check localStorage
      try {
        const stored = localStorage.getItem('hellonoid_user');
        info.localStorage.raw = stored;
        if (stored) {
          info.localStorage.parsed = JSON.parse(stored);
        }
      } catch (err: any) {
        info.localStorage.error = err?.message || 'Unknown error';
      }

      // Check getCurrentUser
      try {
        info.user = getCurrentUser();
      } catch (err: any) {
        info.userError = err?.message || 'Unknown error';
      }

      // Check Supabase session
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        info.supabase.session = session ? {
          user: session.user?.email,
          expires_at: session.expires_at,
        } : null;
        info.supabase.error = error?.message;
      } catch (err: any) {
        info.supabase.error = err?.message || 'Unknown error';
      }

      setDebugInfo(info);
    }

    gatherDebugInfo();
    
    // Update every 2 seconds
    const interval = setInterval(gatherDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAuth = () => {
    localStorage.removeItem('hellonoid_user');
    window.location.reload();
  };

  const handleForceLogin = () => {
    const user = { email: 'f.linder@me.com', role: 'admin' };
    localStorage.setItem('hellonoid_user', JSON.stringify(user));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Auth Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
            <h2 className="text-lg font-semibold mb-4">Controls</h2>
            <div className="space-x-4">
              <button
                onClick={handleClearAuth}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Clear Auth
              </button>
              <button
                onClick={handleForceLogin}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Force Login (Fredrik)
              </button>
              <a href="/login" className="bg-[#239eab] hover:bg-[#1e7a85] px-4 py-2 rounded inline-block">
                Go to Login
              </a>
              <a href="/admin" className="bg-[#239eab] hover:bg-[#1e7a85] px-4 py-2 rounded inline-block">
                Go to Admin
              </a>
            </div>
          </div>

          <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
            <h2 className="text-lg font-semibold mb-4">Debug Info</h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}