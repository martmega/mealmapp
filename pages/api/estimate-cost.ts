import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  console.log('🚀 Request body:', req.body);

  const { recipe } = req.body;

  if (!recipe || !Array.isArray(recipe.ingredients) || !recipe.servings) {
    return res.status(400).json({ error: 'Invalid recipe data' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const content = `Estime le coût total de la recette suivante pour ${recipe.servings} personnes : ${recipe.name}. Ingrédients : ${recipe.ingredients
      .map((i: any) => `${i.quantity} ${i.unit} de ${i.name}`)
      .join(', ')}. Réponds uniquement par un prix approximatif en euros.`;

    const messages = [{ role: 'user', content }];

    console.log('➡️ Sending OpenAI request:', {
      model: 'gpt-3.5-turbo',
      messages,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const price = response.choices[0].message.content;
    return res.status(200).json({ estimated_price: price });
  } catch (err) {
    console.error('🧨 Erreur estimate-cost handler:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', details: err?.toString() });
  }
}
