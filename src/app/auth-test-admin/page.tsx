'use client';

import { useState, useEffect } from 'react';

export default function AuthTestAdminPage() {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if logged in
    const stored = localStorage.getItem('test_user');
    if (stored) {
      setUser(stored);
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/auth-test';
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('test_user');
    window.location.href = '/auth-test';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0d] text-white p-8 flex items-center justify-center">
        <p>Laddar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0c0d] text-white p-8 flex items-center justify-center">
        <p>Omdirigerar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Test Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logga ut
          </button>
        </div>
        
        <div className="bg-[#161616] rounded-lg p-6 border border-[#27272a]">
          <h2 className="text-xl font-semibold mb-4">Välkommen till admin</h2>
          <p className="text-gray-400 mb-4">Inloggad som: {user}</p>
          
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded">
              ✅ Auth fungerar! Du är inloggad och har kommit hit.
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Test navigering:</h3>
              <div className="space-x-4">
                <a href="/auth-test" className="text-[#239eab] hover:underline">
                  Tillbaka till login
                </a>
                <a href="/admin/pipeline" className="text-[#239eab] hover:underline">
                  Riktiga pipeline
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}