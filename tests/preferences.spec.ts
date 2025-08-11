import { describe, it, expect } from 'vitest';
import { toDbPrefs, fromDbPrefs } from '@/lib/menuPreferences';

describe('preferences conversion', () => {
  it('preserves commonMenuSettings through DB round trip', () => {
    const prefs = {
      servingsPerMeal: 3,
      maxCalories: 1500,
      weeklyBudget: 20,
      meals: [
        { id: 1, mealNumber: 1, types: ['petit-dejeuner', 'brunch'], enabled: true },
      ],
      tagPreferences: ['vegan'],
      commonMenuSettings: {
        enabled: false,
        linkedUsers: [{ id: 'u1', name: 'Alice', ratio: 50 }],
        linkedUserRecipes: [],
      },
    };

    const dbShape = toDbPrefs(prefs);
    expect(dbShape.common_menu_settings).toEqual(prefs.commonMenuSettings);
    expect(dbShape.daily_meal_structure).toEqual([
      ['petit-dejeuner', 'brunch'],
    ]);
    expect(dbShape.tag_preferences).toEqual(['vegan']);

    const restored = fromDbPrefs(dbShape);
    expect(restored).toEqual(prefs);
  });

  it('defaults arrays when DB returns empty common_menu_settings', () => {
    const restored = fromDbPrefs({ common_menu_settings: {} });
    expect(restored.commonMenuSettings).toEqual({ enabled: false, linkedUsers: [], linkedUserRecipes: [] });
  });
});
