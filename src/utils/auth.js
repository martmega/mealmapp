import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey)
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.warn('Error fetching user from token:', error.message);
    return null;
  }
  const user = data.user || null;
  if (user && !user.raw_user_meta_data && user.user_metadata) {
    user.raw_user_meta_data = user.user_metadata;
  }
  return user;
}
