import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log('openai ready');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('💬 API HIT');

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  console.log('🔍 Received body:', req.body);
  console.log('🔑 OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);

  try {
    // Pas d\'appel OpenAI pour l'instant
    return res.status(200).json({ debug: 'OK jusqu\'ici' });
  } catch (err) {
    console.error('🔥 ERREUR :', err);
    return res.status(500).json({ error: 'Erreur interne', details: String(err) });
  }
}
