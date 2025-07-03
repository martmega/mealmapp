import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getUserFromRequest } from '../src/utils/auth.js';

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('public_user_view')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Subscription fetch error:', profileError.message);
  }
  const subscriptionTier = profile?.subscription_tier || 'standard';
  if (subscriptionTier !== 'premium') {
    return res.status(403).json({ error: 'Premium only' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }
  const openai = new OpenAI({ apiKey });

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    await supabaseAdmin.rpc('decrement_ia_credit', {
      user_uuid: user.id,
      credit_type: 'text',
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('generate-recipe error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
