import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AuthLink() {
  const supabase = await createClient();
  
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Användare är inte inloggad - visa login-länk
      return (
        <Link 
          href="/login" 
          className="transition hover:text-white opacity-75 hover:opacity-100"
        >
          Sign in
        </Link>
      );
    }

    // Användare är inloggad - visa admin-länk
    return (
      <Link 
        href="/admin" 
        className="transition hover:text-white text-[#239eab]"
      >
        Admin
      </Link>
    );
  } catch {
    // Om något går fel, visa login-länk som fallback
    return (
      <Link 
        href="/login" 
        className="transition hover:text-white opacity-75 hover:opacity-100"
      >
        Sign in
      </Link>
    );
  }
}