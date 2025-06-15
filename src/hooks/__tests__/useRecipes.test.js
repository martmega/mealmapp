import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/components/ui/use-toast.js', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useRecipes } from '../useRecipes.jsx';

describe('useRecipes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads recipes from localStorage when no session', () => {
    const saved = [{ id: '1', name: 'Saved' }];
    localStorage.setItem('localRecipes', JSON.stringify(saved));
    const { result } = renderHook(() => useRecipes(null));
    expect(result.current.recipes).toEqual(saved);
  });

  it('adds recipe locally when no session', async () => {
    const { result } = renderHook(() => useRecipes(null));
    await act(async () => {
      await result.current.addRecipe({
        name: 'New',
        servings: 2,
        meal_types: ['plat'],
        ingredients: [],
        instructions: [],
      });
    });
    expect(result.current.recipes.length).toBe(1);
    const stored = JSON.parse(localStorage.getItem('localRecipes'));
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('New');
  });
});
