import { NextApiRequest, NextApiResponse } from 'next';
import { generateRecipeCostEstimation } from '@/api/estimate-cost';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { recipe } = req.body;

  if (!recipe || !Array.isArray(recipe.ingredients)) {
    return res.status(400).json({ error: 'Recette invalide' });
  }

  try {
    const estimatedPrice = await generateRecipeCostEstimation(recipe);
    res.status(200).json({ estimated_price: estimatedPrice });
  } catch (error) {
    console.error('Erreur OpenAI', error);
    res.status(500).json({ error: "Erreur lors de l'estimation" });
  }
}
