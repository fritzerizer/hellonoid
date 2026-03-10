import { createClient } from '@supabase/supabase-js';
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
    // Try to get user from session/cookie/header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabase();
    
    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Get user role from admin_users table
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return null; // Not an admin user
    }

    return {
      id: user.id,
      email: user.email!,
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