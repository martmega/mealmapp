import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { z } from 'zod';
import { getUserFromRequest } from '@/utils/auth';

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
    parsed = RecipeSchema.parse(req.body.recipe);
    console.log('Valid payload:', parsed);
  } catch (error) {
    console.error('Invalid recipe payload:', error);
    const message =
      error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error);
    return res.status(400).json({ error: 'Invalid recipe payload', details: message });
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

    const prompt = `R\u00e9dige une courte description pour la recette "${parsed.title ||
      'Recette'}" avec les ingr\u00e9dients suivants : ${parsed.ingredients.join(', ')}. Instructions : ${parsed.instructions}`;

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
