import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Uppdatera och verifiera användar-session
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Matcha alla routes utom statiska filer och Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};