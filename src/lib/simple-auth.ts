import { createClient } from '@supabase/supabase-js';

// Single global Supabase instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  email: string;
  role: string;
}

export async function signIn(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error: 'Invalid login credentials' };
    }

    if (!data.user) {
      return { error: 'Login failed' };
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', data.user.email)
      .single();

    if (!adminUser && data.user.email !== 'f.linder@me.com') {
      await supabase.auth.signOut();
      return { error: 'Access denied - admin privileges required' };
    }

    const role = adminUser?.role || 'admin';
    
    // Store user info in localStorage for persistence
    localStorage.setItem('hellonoid_user', JSON.stringify({
      email: data.user.email,
      role: role
    }));

    return { user: { email: data.user.email!, role } };
  } catch (err) {
    return { error: 'Login failed' };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('hellonoid_user');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // First check localStorage
    const stored = localStorage.getItem('hellonoid_user');
    if (stored) {
      const user = JSON.parse(stored);
      
      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === user.email) {
        return user;
      } else {
        // Session invalid, clear storage
        localStorage.removeItem('hellonoid_user');
      }
    }

    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return null;
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!adminUser && session.user.email !== 'f.linder@me.com') {
      await signOut();
      return null;
    }

    const role = adminUser?.role || 'admin';
    const user = { email: session.user.email!, role };
    
    // Store in localStorage
    localStorage.setItem('hellonoid_user', JSON.stringify(user));
    
    return user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export { supabase };