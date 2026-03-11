'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in? Redirect to admin.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  // Don't render the form while checking session or if already logged in
  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#239eab]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // On success, onAuthStateChange fires → user is set → useEffect redirects
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">
              hellonoid<span className="text-[#239eab]">.</span>
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-gray-400">Access the admin panel</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-3 bg-[#161616] border border-[#27272a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#239eab] focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-3 bg-[#161616] border border-[#27272a] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#239eab] focus:border-transparent"
                placeholder="Your password"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#239eab] hover:bg-[#1e7a85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#239eab] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
