import { normalizeIngredientName, normalizeUnit, canCombineUnits, convertQuantity } from '../ingredientNormalizer.js';

describe('ingredient normalizer', () => {
  it('normalizes ingredient names', () => {
    expect(normalizeIngredientName('Oeufs')).toBe('oeuf');
  });

  it('normalizes units', () => {
    expect(normalizeUnit('grammes')).toBe('g');
  });

  it('detects combinable units', () => {
    expect(canCombineUnits('g', 'kg')).toBe(true);
  });

  it('converts quantities', () => {
    expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
  });
});
