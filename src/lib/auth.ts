import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { NextRequest } from 'next/server';

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    try { 
      key = readFileSync(`${homedir()}/.secrets/supabase-service-role`, 'utf-8').trim(); 
    } catch {}
  }
  if (!key) key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'agent';
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    let userId: string | undefined;
    let userEmail: string | undefined;

    // 1. Try Bearer token (for API/agent calls)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email;
      }
    }

    // 2. Fall back to cookie-based session (for browser requests)
    if (!userId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll() {
              // Read-only in route handlers
            },
          },
        }
      );
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        userId = user.id;
        userEmail = user.email;
      }
    }

    if (!userId || !userEmail) {
      return null;
    }

    // Get user role from admin_users table
    const adminSupabase = getSupabase();
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('email', userEmail)
      .single();

    if (!adminUser) {
      // Hardcoded admin fallback
      if (userEmail === 'f.linder@me.com') {
        return { id: userId, email: userEmail, role: 'admin' };
      }
      return null;
    }

    return {
      id: userId,
      email: userEmail,
      role: adminUser.role as 'admin' | 'editor' | 'agent'
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest, minRole: 'admin' | 'editor' | 'agent' = 'agent'): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }

  const roleHierarchy = { agent: 0, editor: 1, admin: 2 };
  if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
    throw new Error('Insufficient permissions');
  }

  return user;
}