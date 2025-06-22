import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not defined');

export let supabase = createClient(supabaseUrl, supabaseAnonKey);

export function initializeSupabase(session) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    },
  });
}
