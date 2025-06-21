import { NextApiRequest, NextApiResponse } from 'next';
import { generateRecipeEstimate } from '@/api/generateEstimate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt manquant ou invalide' });
  }

  try {
    const result = await generateRecipeEstimate(prompt);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Erreur OpenAI', error);
    res.status(500).json({ error: "Erreur lors de la génération" });
  }
}
