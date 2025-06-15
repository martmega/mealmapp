import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecipes } from './useRecipes.jsx';

vi.mock('@/components/ui/use-toast.js', () => ({ useToast: () => ({ toast: vi.fn() }) }));

beforeEach(() => {
  localStorage.clear();
});

describe('useRecipes', () => {
  it('adds recipe locally when no session', async () => {
    const { result } = renderHook(() => useRecipes(null));

    await act(async () => {
      await result.current.addRecipe({
        name: 'Test',
        ingredients: [],
        instructions: [],
        meal_types: [],
        tags: [],
        servings: 1,
      });
    });

    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.recipes[0].name).toBe('Test');
    expect(result.current.recipes[0].id).toMatch(/^local_/);
  });

  it('persists recipes in localStorage', async () => {
    const { result } = renderHook(() => useRecipes(null));

    await act(async () => {
      await result.current.addRecipe({
        name: 'Stored',
        ingredients: [],
        instructions: [],
        meal_types: [],
        tags: [],
        servings: 1,
      });
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('localRecipes'));
      expect(stored[0].name).toBe('Stored');
    });
  });
});
