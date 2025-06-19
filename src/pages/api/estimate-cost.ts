import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 👈 sécurisée (non exposée au client)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { ingredients, servings } = req.body;

  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Ingrédients manquants ou invalides" });
  }

  const formattedIngredients = ingredients
    .map((ing: any) => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
    .join("\n");

  const prompt = `
Estime le coût total approximatif de cette recette pour ${servings || 4} personnes :
${formattedIngredients}
Donne seulement le prix estimé, en euros, arrondi à 0,10€. Sans texte autour.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const response = completion.choices[0].message.content;
    const parsed = parseFloat(response?.replace(/[^\d.,]/g, "").replace(",", "."));

    const estimatedPrice = isNaN(parsed) ? null : Number(parsed.toFixed(2));

    res.status(200).json({ estimated_price: estimatedPrice });
  } catch (error) {
    console.error("Erreur OpenAI", error);
    res.status(500).json({ error: "Erreur lors de l'estimation" });
  }
}
