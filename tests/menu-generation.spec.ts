import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMenuGeneration } from '../src/hooks/useMenuGeneration.js';

function createRecipes() {
  const recipes = [];
  for (let i = 1; i <= 4; i++) {
    recipes.push({ id: `recipe-${i}`, name: `Recipe ${i}`, meal_types: ['petit-dejeuner'] });
  }
  for (let i = 5; i <= 7; i++) {
    recipes.push({ id: `recipe-${i}`, name: `Recipe ${i}`, meal_types: ['plat'] });
  }
  for (let i = 8; i <= 10; i++) {
    recipes.push({ id: `recipe-${i}`, name: `Recipe ${i}`, meal_types: ['encas-sucre'] });
  }
  return recipes;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('menu generation', () => {
  it('uses every recipe once before repeating', async () => {
    const recipes = createRecipes();
    const preferences = {
      meals: [
        { id: 1, types: ['petit-dejeuner'], enabled: true, mealNumber: 1 },
        { id: 2, types: ['plat'], enabled: true, mealNumber: 2 },
        { id: 3, types: ['encas-sucre', 'encas-sale'], enabled: true, mealNumber: 3 },
      ],
      maxCalories: 2200,
      weeklyBudget: 0,
      tagPreferences: [],
      servingsPerMeal: 4,
    };

    const setMenu = vi.fn();

    vi.spyOn(Math, 'random').mockReturnValue(0.42);

    const { result } = renderHook(() =>
      useMenuGeneration(recipes, preferences, setMenu, {})
    );

    await act(async () => {
      await result.current.generateMenu();
    });

    const menu = setMenu.mock.calls[0][0];
    const ids: string[] = [];
    menu.forEach((day: any[]) => {
      day.forEach((meal: any[]) => {
        meal.forEach((r: any) => ids.push(r.id));
      });
    });

    const firstBatch = ids.slice(0, recipes.length);
    expect(new Set(firstBatch).size).toBe(recipes.length);
  });
});
