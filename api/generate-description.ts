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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = `
Tu es un assistant culinaire.
Écris une courte description appétissante (2 à 3 phrases max) pour un plat appelé "${parsed.title || 'Recette'}".
Voici ses ingrédients : ${parsed.ingredients.join(', ')}.
Voici les instructions de préparation : ${parsed.instructions}.
N'inclus pas les instructions ni de formulation directive.
N’utilise pas de pronoms personnels (comme "notre", "vos", etc.).
N’utilise pas de formules d’accroche comme “Découvrez”, “Succombez à”, etc.
Ne termine pas par une formule type “Bon appétit”.
Écris une description comme sur une fiche recette ou une carte de restaurant, en te concentrant sur le rendu final et l’intérêt gustatif du plat.
`;


    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const description = response.choices[0].message.content || '';

    await supabaseAdmin.rpc('decrement_ia_credit', {
      user_uuid: user.id,
      credit_type: 'text',
    });

    return res.status(200).json({ description });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', details: String(err) });
  }
}
