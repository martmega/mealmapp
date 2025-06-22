import { createClient } from '@supabase/supabase-js';

let supabase = null;

export const getSupabase = () => {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

export function initializeSupabase(session) {
  const client = getSupabase();
  if (session?.access_token && session?.refresh_token) {
    client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } else {
    client.auth.signOut();
  }
}
