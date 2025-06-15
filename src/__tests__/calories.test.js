import { describe, it, expect } from 'vitest';
import { calculateTotalCalories } from '../lib/calories.js';

describe('calculateTotalCalories', () => {
  it('returns total calories per serving', () => {
    const ingredients = [
      { name: 'riz', quantity: 200, unit: 'g' },
      { name: 'poulet', quantity: 100, unit: 'g' }
    ];
    const result = calculateTotalCalories(ingredients, 2);
    expect(result).toBe(213);
  });
});
