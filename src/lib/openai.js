import OpenAI from 'openai';

const apiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) ||
  process.env.VITE_OPENAI_API_KEY;

export const openaiIsAvailable = !!apiKey;

let openai = null;
if (openaiIsAvailable) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
} else {
  console.warn('⚠️ Pas de clé OpenAI disponible côté client');
}

export const generateRecipeDescription = async (recipe) => {
  if (!openaiIsAvailable) {
    console.warn('⚠️ Pas de clé OpenAI disponible côté client');
    return null;
  }
  try {
    const prompt = `Génère une description détaillée et attrayante pour la recette suivante:
    Nom: ${recipe.name}
    Ingrédients: ${recipe.ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
    Instructions: ${recipe.instructions}
    Calories: ${recipe.calories} par portion
    Type de repas: ${recipe.mealTypes.join(', ')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un expert culinaire qui écrit des descriptions de recettes attrayantes et détaillées.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erreur lors de la génération de la description:', error);
    return null;
  }
};

export const generateRecipeImage = async (recipe) => {
  if (!openaiIsAvailable) {
    console.warn('⚠️ Pas de clé OpenAI disponible côté client');
    return null;
  }
  try {
    const prompt = `Une photo appétissante de ${recipe.name}, style photographie culinaire professionnelle`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    return response.data[0].url;
  } catch (error) {
    console.error("Erreur lors de la génération de l'image:", error);
    return null;
  }
};

export const estimateRecipePrice = async (recipe) => {
  try {
    const response = await fetch('/api/estimate-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe }),
    });

    if (!response.ok) throw new Error('Request failed');

    const data = await response.json();
    return typeof data.price === 'number' ? data.price : null;
  } catch (error) {
    console.error("Erreur lors de l'estimation du prix:", error);
    return null;
  }
};
