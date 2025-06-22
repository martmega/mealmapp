import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { z } from 'zod';
import { getUserFromRequest } from '../src/utils/auth.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const RecipeSchema = z.object({
  title: z.string().optional(),
  ingredients: z.array(z.string()),
  instructions: z.string().min(10),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.headers['content-type']?.includes('application/json')) {
    return res
      .status(400)
      .json({ error: 'Content-Type must be application/json' });
  }

  let parsed;
  try {
    const { recipe } = req.body;
    parsed = RecipeSchema.parse(recipe);
  } catch (err) {
    console.error('Payload invalid:', err);
    return res.status(400).json({ error: 'Invalid recipe payload', details: err });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('public_users')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Subscription fetch error:', profileError.message);
  }

  const subscriptionTier = profile?.subscription_tier || 'standard';

  let quotaExceeded = false;
  if (subscriptionTier === 'vip') {
    const month = new Date().toISOString().slice(0, 7);
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('ia_usage')
      .select('text_requests')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (usageError) {
      console.error('ia_usage fetch error:', usageError.message);
    }

    const count = usage?.text_requests ?? 0;
    if (count >= 20) {
      quotaExceeded = true;
    } else {
      const { error: upsertError } = await supabaseAdmin.from('ia_usage').upsert(
        { user_id: user.id, month, text_requests: count + 1 },
        { onConflict: 'user_id,month' }
      );
      if (upsertError) {
        console.error('ia_usage upsert error:', upsertError.message);
      }
    }
  } else if (subscriptionTier !== 'premium' && subscriptionTier !== 'standard') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (quotaExceeded) {
    return res
      .status(429)
      .json({ error: 'Quota IA (description) atteint pour ce mois.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = `
Tu es un assistant culinaire. 
\u00c9cris une courte description attrayante (2 \u00e0 3 phrases max) pour un plat appel\u00e9 "${parsed.title || 'Recette'}". 
Voici ses ingr\u00e9dients : ${parsed.ingredients.join(', ')}.
Voici les instructions de pr\u00e9paration : ${parsed.instructions}.
Ne recopie pas les instructions. Utilise-les uniquement pour savoir de quoi il s'agit.
Fais une description app\u00e9tissante du plat final, comme on le lirait dans une carte de restaurant ou sur une fiche recette pour donner envie de le cuisiner.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const description = response.choices[0].message.content || '';
    return res.status(200).json({ description });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', details: String(err) });
  }
}
