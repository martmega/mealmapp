
export const generateRecipe = async (prompt, subscriptionTier = 'standard') => {
  try {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'x-subscription-tier': subscriptionTier,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error('Request failed');

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la génération de la recette:', error);
    return null;
  }
};

export const estimateRecipePrice = async (
  recipe,
  subscriptionTier = 'standard'
) => {
  try {
    const response = await fetch('/api/estimate-cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-subscription-tier': subscriptionTier,
      },
      body: JSON.stringify({ recipe }),
    });

    if (!response.ok) throw new Error('Request failed');

    const { price } = await response.json();
    const normalized = String(price).replace(',', '.');
    const value = parseFloat(normalized);
    console.log('Price estimate:', value);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.error("Erreur lors de l'estimation du prix:", error);
    return null;
  }
};
