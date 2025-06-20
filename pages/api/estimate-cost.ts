import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipe } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ingredientsList = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
          .map((ing) => `${ing.quantity} ${ing.unit || ''} ${ing.name}`.trim())
          .join(', ')
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Estime le coût total pour préparer cette recette destinée à ${recipe.servings} personnes. Ingrédients : ${ingredientsList}. Réponds uniquement par le montant arrondi à deux décimales (ex: 4.80) sans unité ni texte.`,
        },
      ],
    });

    const priceText = response.choices[0].message.content || '';
    const normalized = priceText.replace(',', '.').replace(/[^0-9.]/g, '');
    const price = parseFloat(normalized);
    return res.status(200).json({ price });
  } catch (err) {
    console.error('Erreur estimation coût :', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
