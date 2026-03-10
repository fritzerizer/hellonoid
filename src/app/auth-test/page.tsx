'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthTestPage() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check localStorage on load
    const stored = localStorage.getItem('test_user');
    if (stored) {
      setUser(stored);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Super simple fake login
    if (email === 'test@test.com' && password === 'test') {
      localStorage.setItem('test_user', email);
      setUser(email);
      // Test redirect
      setTimeout(() => {
        window.location.href = '/auth-test-admin';
      }, 500);
    } else {
      alert('Fel lösenord - använd test@test.com / test');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('test_user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8">Auth Test</h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-400">Inloggad som: {user}</p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Logga ut
            </button>
            <div>
              <a href="/auth-test-admin" className="text-[#239eab] hover:underline">
                Gå till admin (länk)
              </a>
            </div>
            <div>
              <button
                onClick={() => window.location.href = '/auth-test-admin'}
                className="bg-[#239eab] hover:bg-[#1e7a85] px-4 py-2 rounded"
              >
                Gå till admin (redirect)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#27272a] rounded text-white"
                placeholder="test@test.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#27272a] rounded text-white"
                placeholder="test"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#239eab] hover:bg-[#1e7a85] py-2 rounded font-medium"
            >
              Logga in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}