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
  it('builds an english prompt from recipe data', () => {
    const prompt = generateRecipeImagePrompt(recipe);
    expect(prompt).toBe(
      'A delicious and realistic photo of a home-cooked dish: fried eggs with bacon and grilled cheese. It includes: egg, bacon, bread, cheese. Styled simply on a plate or in a pan. Lighting is natural and appetizing. Do not use a restaurant or gourmet aesthetic. Show the food clearly. No people, no logos, no text. Focus on realistic food presentation, homemade style.'
    );
  });
});
