'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'agent';
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const resolveRole = useCallback(async (email: string): Promise<'admin' | 'editor' | 'agent'> => {
    // Hardcoded admin
    if (email === 'f.linder@me.com') return 'admin';

    try {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .single();
      if (adminUser?.role) return adminUser.role as 'admin' | 'editor' | 'agent';
    } catch {}

    return 'agent';
  }, [supabase]);

  const buildAuthUser = useCallback(async (su: SupabaseUser): Promise<AuthUser> => {
    const role = await resolveRole(su.email!);
    return { id: su.id, email: su.email!, role };
  }, [resolveRole]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user: su } }) => {
      if (su) {
        setSupabaseUser(su);
        const authUser = await buildAuthUser(su);
        setUser(authUser);

        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      }
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setSupabaseUser(newSession.user);
          const authUser = await buildAuthUser(newSession.user);
          setUser(authUser);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, buildAuthUser]);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Login failed' };
    }

    // Check admin access
    const role = await resolveRole(data.user.email!);
    if (!role) {
      await supabase.auth.signOut();
      return { error: 'Access denied' };
    }

    // State updates happen via onAuthStateChange listener
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
