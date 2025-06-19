import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipe } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Estime le prix de cette recette pour ${recipe.servings} personnes : ${JSON.stringify(recipe.ingredients)}. Donne uniquement le prix en euros.`,
        },
      ],
    });

    const priceText = response.choices[0].message.content;
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    return res.status(200).json({ price });
  } catch (err) {
    console.error('Erreur estimation coût :', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
