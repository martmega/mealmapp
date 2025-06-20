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
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { key } = req.body || {};
  if (!key) {
    return res.status(400).json({ error: 'Key required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('access_keys')
      .select('id, grants, used_by')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid key' });
    }

    if (data.used_by) {
      return res.status(409).json({ error: 'Key already used' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('access_keys')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      console.warn('access_keys update error:', updateError.message);
    }

    return res.status(200).json({ grants: data.grants });
  } catch (err) {
    console.error('access-key error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
