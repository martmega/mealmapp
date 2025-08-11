import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}
if (!openAiKey) {
  console.error('OPENAI_API_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: openAiKey });

async function estimateRecipePrice(recipe: any): Promise<number | null> {
  const ingredientsList = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
        .map((ing: any) => `- ${ing.quantity} ${ing.unit ? ing.unit + ' ' : ''}${ing.name}`.trim())
        .join('\n')
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: `Tu es un assistant culinaire. Estime le coût total d'une recette pour les quantités ci-dessous. Donne uniquement le prix en euros, sans explication ni unité. Par exemple : "4.70".\n\nRecette : ${recipe.name}\nNombre de portions : ${recipe.servings}\n\nIngrédients :\n${ingredientsList}`,
      },
    ],
  });

  const priceText = response.choices[0]?.message?.content || '';
  const normalized = priceText.replace(',', '.').replace(/[^0-9.]/g, '');
  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

async function estimateWithRetry(recipe: any, maxRetries = 5): Promise<number | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const price = await estimateRecipePrice(recipe);
      if (price !== null) return price;
      throw new Error('Invalid price');
    } catch (err) {
      const delay = Math.pow(2, attempt) * 1000;
      console.error(`Estimation failed for recipe ${recipe.id} (attempt ${attempt + 1}):`, err);
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return null;
}

async function main() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, name, servings, ingredients')
    .is('estimated_price', null);

  if (error) {
    console.error('Failed to fetch recipes:', error.message);
    process.exit(1);
  }

  const failures: string[] = [];
  for (const recipe of recipes || []) {
    const price = await estimateWithRetry(recipe);
    if (price !== null) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ estimated_price: price })
        .eq('id', recipe.id);
      if (updateError) {
        console.error(`Failed to update recipe ${recipe.id}:`, updateError.message);
        failures.push(recipe.id);
      } else {
        console.log(`Recipe ${recipe.id} estimated at €${price.toFixed(2)}`);
      }
    } else {
      failures.push(recipe.id);
    }
  }

  if (failures.length) {
    console.error('Persistent failures for recipe IDs:', failures.join(', '));
  }
}

main();
