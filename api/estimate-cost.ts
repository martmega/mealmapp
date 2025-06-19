import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const recipe = req.body;
    const prompt = `Estime le coût pour préparer la recette suivante pour ${recipe.servings} personnes :\n${recipe.name} avec les ingrédients : ${recipe.ingredients.map(i => `${i.quantity} ${i.unit} de ${i.name}`).join(', ')}. Donne juste un nombre en euros.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const answer = response.choices[0].message?.content || '0';
    const price = parseFloat(answer.replace(/[^\d.]/g, ''));

    return res.status(200).json({ estimated_price: price });
  } catch (error) {
    return res.status(500).json({ error: 'Estimation failed', details: error });
  }
}
