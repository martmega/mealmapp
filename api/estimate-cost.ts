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
  if (!user || (user as any).raw_user_meta_data?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Premium only' });
  }

  try {
    const { recipe } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ingredientsList = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
          .map(
            (ing: { quantity?: string | number; unit?: string; name: string }) =>
              `- ${ing.quantity} ${ing.unit ? ing.unit + ' ' : ''}${ing.name}`.trim()
          )
          .join('\n')
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Tu es un assistant culinaire. Estime le coût total d'une recette pour les quantités ci-dessous. Donne uniquement le prix en euros, sans explication ni unité. Par exemple : "4.70".\n\nRecette : ${recipe.name}\nNombre de portions : ${recipe.servings}\n\nIngrédients :\n${ingredientsList}`,
        },
      ],
    });

    const priceText = response.choices[0].message.content || '';
    const normalized = priceText.replace(',', '.').replace(/[^0-9.]/g, '');
    const price = parseFloat(normalized);

    await supabaseAdmin.rpc('decrement_ia_credit', {
      user_uuid: user.id,
      credit_type: 'text',
    });

    return res.status(200).json({ price });
  } catch (err) {
    console.error('Erreur estimation coût :', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
