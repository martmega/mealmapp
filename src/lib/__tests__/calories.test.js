import { calculateIngredientCalories, calculateTotalCalories } from '../calories.js';

describe('calorie utilities', () => {
  it('calculates ingredient calories correctly', () => {
    const ingredient = { quantity: 100, unit: 'g', name: 'riz' };
    expect(calculateIngredientCalories(ingredient)).toBe(130);
  });

  it('calculates total calories per serving', () => {
    const ingredients = [
      { quantity: 100, unit: 'g', name: 'riz' },
      { quantity: 100, unit: 'g', name: 'poulet' },
    ];
    expect(calculateTotalCalories(ingredients, 2)).toBe(
      Math.round((130 + 165) / 2)
    );
  });
});
