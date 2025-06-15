import { describe, it, expect } from 'vitest';
import {
  normalizeIngredientName,
  normalizeUnit,
  canCombineUnits,
  convertQuantity,
} from './ingredientNormalizer';

describe('ingredientNormalizer utilities', () => {
  it('normalizes ingredient names', () => {
    expect(normalizeIngredientName('Oeufs')).toBe('oeuf');
    expect(normalizeIngredientName('Tomates')).toBe('tomate');
  });

  it('normalizes units', () => {
    expect(normalizeUnit('Gramme')).toBe('g');
    expect(normalizeUnit('KILO')).toBe('kg');
  });

  it('checks combinable units', () => {
    expect(canCombineUnits('g', 'kg')).toBe(true);
    expect(canCombineUnits('g', 'ml')).toBe(false);
  });

  it('converts quantities', () => {
    expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
    expect(convertQuantity(200, 'g', 'kg')).toBeCloseTo(0.2);
  });
});
