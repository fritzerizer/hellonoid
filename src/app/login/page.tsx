'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Inloggning lyckades! Omdirigerar...');
        // Redirect sker automatiskt via middleware
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logotyp */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">
              hellonoid<span className="text-[#239eab]">.</span>
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">
            Logga in
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Få tillgång till admin-panelen
          </p>
        </div>

        {/* Formulär */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                E-postadress
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#239eab] focus:border-transparent"
                placeholder="din@email.se"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Lösenord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#239eab] focus:border-transparent"
                placeholder="Ditt lösenord"
              />
            </div>
          </div>

          {/* Error/Success meddelanden */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Login-knapp */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#239eab] hover:bg-[#1e8a95] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#239eab] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </div>

          {/* Tillbaka-länk */}
          <div className="text-center">
            <Link href="/" className="text-sm text-[#239eab] hover:underline">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}