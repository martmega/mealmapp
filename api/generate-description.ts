import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '@/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user || user.raw_user_meta_data?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Premium only' });
  }

  const { recipe } = req.body;
  if (!recipe) {
    return res.status(400).json({ error: 'Missing recipe' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const prompt = `G\u00e9n\u00e8re une description courte (environ 150 caract\u00e8res), engageante et app\u00e9tissante pour ${recipe.name}. Ingr\u00e9dients: ${recipe.ingredients?.map((i:any)=>`${i.quantity||''} ${i.unit||''} ${i.name}`).join(', ')}. Instructions: ${Array.isArray(recipe.instructions)?recipe.instructions.join(' '):''}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await response.json();
    const description = result.choices?.[0]?.message?.content || '';
    return res.status(200).json({ description });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
