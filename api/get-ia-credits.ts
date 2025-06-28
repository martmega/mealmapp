import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../src/utils/auth.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('ia_usage')
      .select('text_requests, image_requests')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (usageError) {
      console.error('ia_usage fetch error:', usageError.message);
    }

    const { data: credits, error: creditErr } = await supabaseAdmin
      .from('ia_credits')
      .select('text_credits, image_credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditErr) {
      console.error('ia_credits fetch error:', creditErr.message);
    }

    return res.status(200).json({
      ia_usage: {
        text_requests: usage?.text_requests ?? 0,
        image_requests: usage?.image_requests ?? 0,
      },
      ia_credits: {
        text_credits: credits?.text_credits ?? 0,
        image_credits: credits?.image_credits ?? 0,
      },
    });
  } catch (err) {
    console.error('get-ia-credits error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
