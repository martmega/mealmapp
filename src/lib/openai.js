
export const generateRecipe = async (prompt, subscriptionTier = 'standard') => {
  try {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
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
  subscriptionTier = 'standard',
  session
) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-subscription-tier': subscriptionTier,
    };
    const token = session?.access_token ?? session;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.error('Missing access token for /api/estimate-cost request');
    }

    const response = await fetch('/api/estimate-cost', {
      method: 'POST',
      headers,
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

export const formatInstructionsWithAI = async (rawText) => {
  try {
    const response = await fetch('/api/format-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText }),
    });

    if (!response.ok) throw new Error('Request failed');

    const { instructions } = await response.json();
    return Array.isArray(instructions) ? instructions : [];
  } catch (error) {
    console.error('Erreur lors du formatage des instructions:', error);
    return null;
  }
};
