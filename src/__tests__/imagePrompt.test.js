import { describe, it, expect } from 'vitest';
import generateRecipeImagePrompt from '../lib/recipeImagePrompt.js';

const recipe = {
  name: 'Œuf au plat, bacon, grilled cheese',
  description: 'Œuf au plat classic avec son bacon et grilled cheese.',
  ingredients: [
    { name: 'Œuf', quantity: 2, unit: 'pièce' },
    { name: 'Bacon', quantity: 3, unit: 'tranche' },
    { name: 'Pain de mie', quantity: 2, unit: 'tranche' },
    { name: 'Fromage', quantity: 1, unit: 'tranche' },
  ],
};

describe('generateRecipeImagePrompt', () => {
  it('builds a french prompt from recipe data', () => {
    const prompt = generateRecipeImagePrompt(recipe);
    expect(prompt).toBe(
      "Photographie d'un plat maison réaliste : Œuf au plat, bacon, grilled cheese. Ingrédients visibles : Œuf, Bacon, Pain de mie, Fromage. Description : Œuf au plat classic avec son bacon et grilled cheese. Style : photo réaliste, plat simple, appétissant et rustique, fond neutre, assiette centrée, lumière naturelle. Éviter toute décoration sophistiquée ou ingrédients absents, ne pas ajouter de poisson s'il n'y en a pas."
    );
  });
});
