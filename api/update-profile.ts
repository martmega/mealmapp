import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../src/utils/auth.js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey)
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  const body = req.body || {};

  if (!user || user.id !== body.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updates: Record<string, any> = {};
  ['username', 'bio', 'avatar_url', 'user_tag'].forEach((field) => {
    if (body[field] !== undefined) updates[field] = body[field];
  });

  try {
    const { error } = await supabaseAdmin
      .from('public_user_view')
      .update(updates)
      .eq('id', body.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('update-profile error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
