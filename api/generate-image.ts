import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `Photographie culinaire professionnelle de ${recipe.name} pr\u00e9par\u00e9 avec ${recipe.ingredients?.map((i:any)=>`${i.quantity||''} ${i.unit||''} ${i.name}`).join(', ')}.`;
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });
    return res.status(200).json({ url: response.data[0].url });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
