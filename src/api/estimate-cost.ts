import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRecipeCostEstimation(recipe: { ingredients: any[]; servings?: number }) {
  const { ingredients, servings = 4 } = recipe || {};

  if (!Array.isArray(ingredients)) {
    throw new Error('Ingrédients manquants ou invalides');
  }

  const formattedIngredients = ingredients
    .map((ing: any) => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
    .join('\n');

  const prompt = `
Estime le coût total approximatif de cette recette pour ${servings} personnes :
${formattedIngredients}
Donne seulement le prix estimé, en euros, arrondi à 0,10€. Sans texte autour.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const response = completion.choices[0].message.content;
  const parsed = parseFloat(response?.replace(/[^\d.,]/g, '').replace(',', '.'));
  const estimatedPrice = isNaN(parsed) ? null : Number(parsed.toFixed(2));

  return estimatedPrice;
}
