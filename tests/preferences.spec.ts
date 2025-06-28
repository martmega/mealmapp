import { describe, it, expect } from 'vitest';
import { toDbPrefs, fromDbPrefs } from '../src/hooks/useWeeklyMenu.js';

describe('preferences conversion', () => {
  it('preserves commonMenuSettings through DB round trip', () => {
    const prefs = {
      servingsPerMeal: 3,
      maxCalories: 1500,
      weeklyBudget: 20,
      meals: [
        { id: 1, mealNumber: 1, types: ['petit-dejeuner'], enabled: true },
      ],
      tagPreferences: ['vegan'],
      commonMenuSettings: {
        enabled: true,
        linkedUsers: [{ id: 'u1', name: 'Alice', ratio: 50 }],
        linkedUserRecipes: [],
      },
    };

    const dbShape = toDbPrefs(prefs);
    expect(dbShape.common_menu_settings).toEqual(prefs.commonMenuSettings);

    const restored = fromDbPrefs(dbShape);
    expect(restored).toEqual(prefs);
  });
});
