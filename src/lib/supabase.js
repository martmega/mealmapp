import { createClient } from '@supabase/supabase-js';

let supabase = null;

export const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }
  return supabase;
};

let currentSession = null;

export function initializeSupabase(session) {
  const client = getSupabase();

  if (session?.access_token && session?.refresh_token) {
    const tokensChanged =
      !currentSession ||
      currentSession.access_token !== session.access_token ||
      currentSession.refresh_token !== session.refresh_token;

    if (tokensChanged) {
      client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      currentSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };
    }
  } else if (currentSession) {
    client.auth.signOut();
    currentSession = null;
  }
}
