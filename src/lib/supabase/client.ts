import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Browser client för klient-side användning
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}