import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.warn('Error fetching user from token:', error.message);
    return null;
  }
  return data.user || null;
}
