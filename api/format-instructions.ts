import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getUserFromRequest } from '../src/utils/auth.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
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

  if (
    subscriptionTier !== 'premium' &&
    subscriptionTier !== 'standard' &&
    subscriptionTier !== 'vip'
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { rawText } = req.body || {};
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Invalid rawText' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Tu es un assistant culinaire. Reprends ces instructions de recette et transforme-les en une suite d'étapes claires, numérotées si nécessaire. \nChaque étape doit être concise, contenir une seule action ou phase logique, et être formulée de manière naturelle.\nRetourne le tout sous forme d’un tableau JSON, chaque élément représentant une étape.\nN’ajoute pas d’ingrédients, ne déduis pas de quantités, ne change pas l’ordre des étapes.\nVoici les instructions brutes : ${rawText}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0].message.content || '[]';
    let instructions: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        instructions = parsed.map((s) => String(s));
      } else {
        throw new Error('Not an array');
      }
    } catch (err) {
      console.error('Parse error:', err);
      return res.status(500).json({ error: 'Malformed AI response' });
    }

    await supabaseAdmin.rpc('decrement_ia_credit', {
      user_uuid: user.id,
      credit_type: 'text',
    });

    return res.status(200).json({ instructions });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
