'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'agent';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        updateUserFromSession(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          await updateUserFromSession(session);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function updateUserFromSession(session: Session) {
    console.log('updateUserFromSession called with:', session.user.email);
    try {
      // Get user role from admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', session.user.email)
        .single();

      console.log('Admin user lookup result:', { adminUser, error });

      if (error) {
        console.error('Database error fetching admin user:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!adminUser) {
        console.log('No admin user found for email:', session.user.email);
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = {
        id: session.user.id,
        email: session.user.email!,
        role: adminUser.role as 'admin' | 'editor' | 'agent'
      };
      
      console.log('Setting user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  function getAuthToken(): string | null {
    return session?.access_token || null;
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
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