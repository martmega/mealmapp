import { describe, it, expect } from 'vitest';
import { calculateMenuCost } from '../lib/menu.js';

describe('calculateMenuCost', () => {
  it('computes cost with recipe references', () => {
    const recipes = [{ id: '1', estimated_price: 10, servings: 2 }];
    const menu = [[[{ recipe_id: '1', portions: 2 }]], [], [], [], [], [], []];
    expect(calculateMenuCost(menu, recipes)).toBe(10);
  });

  it('computes cost with embedded recipes', () => {
    const menu = [
      [[{ id: '2', estimated_price: 20, servings: 4, plannedServings: 2 }]],
      [],
      [],
      [],
      [],
      [],
      [],
    ];
    expect(calculateMenuCost(menu)).toBe(10);
  });
});
