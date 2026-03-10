'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'editor' | 'agent';
  fallback?: React.ReactNode;
}

export default function AuthGuard({ 
  children, 
  requireRole = 'agent',
  fallback
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#239eab]"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-4">Please log in to access this page.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-[#239eab] text-white px-4 py-2 rounded hover:bg-[#1e8a95] transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check role permissions
  const roleHierarchy = { agent: 0, editor: 1, admin: 2 };
  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[requireRole];

  if (userLevel < requiredLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Insufficient Permissions</h2>
          <p className="text-gray-400 mb-4">
            You need {requireRole} role to access this page. Your role: {user.role}
          </p>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}