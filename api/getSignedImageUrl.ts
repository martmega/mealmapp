import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_BUCKETS } from './_shared/constants.js';

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = req.query.path;
  const bucket = (req.query.bucket as string) || SUPABASE_BUCKETS.recipes;

  if (!path || typeof path !== 'string' || typeof bucket !== 'string') {
    return res.status(400).json({ error: 'Invalid path or bucket' });
  }

  if (
    bucket !== SUPABASE_BUCKETS.recipes &&
    bucket !== SUPABASE_BUCKETS.avatars
  ) {
    return res.status(403).json({ error: 'Bucket not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return res.status(200).json({ url: data.signedUrl });
  } catch (err) {
    if (err instanceof Error) {
      console.error('getSignedImageUrl error:', err.message);
    } else {
      console.error('getSignedImageUrl error:', err);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
