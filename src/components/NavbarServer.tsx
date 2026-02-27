import { createClient } from '@/lib/supabase/server';
import Navbar from './Navbar';

export default async function NavbarServer() {
  const supabase = await createClient();
  
  let isLoggedIn = false;
  let isAdmin = false;
  let userEmail: string | undefined;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!error && user) {
      isLoggedIn = true;
      userEmail = user.email;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      isAdmin = profile?.role === 'admin';
    }
  } catch {
    // Not logged in
  }

  return <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} userEmail={userEmail} />;
}
