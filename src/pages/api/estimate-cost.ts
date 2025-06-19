import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const recipe = req.body.recipe;
  if (!recipe) return res.status(400).json({ error: 'Missing recipe' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: `Estime le coût de cette recette : ${recipe.name}` },
      ],
    });

    const estimatedPrice = parseFloat(response.choices[0].message.content ?? '');
    res.status(200).json({ estimated_price: estimatedPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'OpenAI error' });
  }
}
