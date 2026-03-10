import { createClient } from '@supabase/supabase-js';

// Single Supabase instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  email: string;
  role: string;
}

// Key för localStorage - samma som auth-test användde
const STORAGE_KEY = 'hellonoid_user';

export async function signIn(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    console.log('Starting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Supabase auth error:', error);
      return { error: 'Invalid login credentials' };
    }

    if (!data.user) {
      return { error: 'Login failed' };
    }

    console.log('Supabase auth success for:', data.user.email);

    // Check if user is admin (Fredrik is hardcoded as admin)
    let isAdmin = false;
    let role = 'agent';

    if (data.user.email === 'f.linder@me.com') {
      isAdmin = true;
      role = 'admin';
      console.log('Fredrik detected - admin access granted');
    } else {
      // Check admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', data.user.email)
        .single();

      console.log('Admin check result:', { adminUser, adminError });

      if (adminUser) {
        isAdmin = true;
        role = adminUser.role;
      }
    }

    if (!isAdmin) {
      console.log('Access denied - not an admin');
      await supabase.auth.signOut();
      return { error: 'Access denied - admin privileges required' };
    }

    const user = { email: data.user.email!, role };
    
    // Store in localStorage immediately (same pattern as working test)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    console.log('User stored in localStorage:', user);

    return { user };
  } catch (err) {
    console.error('Login error:', err);
    return { error: 'Login failed' };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export { supabase };