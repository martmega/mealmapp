import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getUserFromRequest } from '@/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.headers['content-type']?.includes('application/json')) {
    return res
      .status(400)
      .json({ error: 'Content-Type must be application/json' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing prompt' });
  }

  const user = await getUserFromRequest(req);
  if (!user || user.raw_user_meta_data?.subscription_tier !== 'premium') {
    return res.status(403).json({ error: 'Premium only' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
