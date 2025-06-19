import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { recipe } = req.body;

  if (!recipe) {
    return res.status(400).json({ error: "Missing recipe data" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Estime le coût total de la recette suivante pour ${recipe.servings} personnes : ${recipe.name}. Ingrédients : ${recipe.ingredients.map(i => `${i.quantity} ${i.unit} de ${i.name}`).join(", ")}.`,
      }],
    });

    const estimatedPrice = response.choices[0].message.content;
    return res.status(200).json({ estimatedPrice });
  } catch (err) {
    console.error("OpenAI estimation failed", err);
    return res.status(500).json({ error: "Failed to estimate cost" });
  }
}
