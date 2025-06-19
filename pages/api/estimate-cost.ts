import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { recipe } = req.body;

    // Vérification des données reçues
    if (!recipe || !recipe.ingredients || !recipe.servings) {
      return res.status(400).json({ error: "Missing or invalid recipe data" });
    }

    // Vérification de la clé API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const openai = new OpenAI({ apiKey });

    const content = `Estime le coût total de la recette suivante pour ${recipe.servings} personnes : ${recipe.name}. Ingrédients : ${recipe.ingredients
      .map((i: any) => `${i.quantity} ${i.unit} de ${i.name}`)
      .join(", ")}. Réponds uniquement par un prix approximatif en euros.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content }],
    });

    const price = response.choices[0].message.content;
    res.status(200).json({ estimated_price: price });
  } catch (error) {
    console.error("Erreur estimation coût :", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: String(error) });
  }
}
