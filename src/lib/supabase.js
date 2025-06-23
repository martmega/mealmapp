import { createClient } from '@supabase/supabase-js';

let supabase = null;

export const getSupabase = (accessToken) => {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not defined');

    const options = accessToken !== undefined ? {
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      },
    } : undefined;

    supabase = createClient(supabaseUrl, supabaseAnonKey, options);
  }
  return supabase;
};

let currentSession = null;

export function initializeSupabase(session) {
  const client = getSupabase(session?.access_token);

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
