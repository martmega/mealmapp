import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_BUCKETS } from '../src/config/constants.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = req.query.path;
  const bucket = req.query.bucket || SUPABASE_BUCKETS.recipes;

  if (!path || typeof path !== 'string' || typeof bucket !== 'string') {
    return res.status(400).json({ error: 'Invalid path or bucket' });
  }

  const allowedBuckets = Object.values(SUPABASE_BUCKETS);
  if (!allowedBuckets.includes(bucket)) {
    return res.status(400).json({ error: 'Invalid bucket' });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return res.status(200).json({ url: data.signedUrl });
  } catch (err) {
    console.error('getSignedImageUrl error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
