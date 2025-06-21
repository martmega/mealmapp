import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { z } from 'zod';
import { getUserFromRequest } from '../src/utils/auth.js';

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
  if (!user || user.raw_user_meta_data?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Premium only' });
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
