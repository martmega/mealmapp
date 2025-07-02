import { describe, it, expect } from 'vitest';
import { toDbPrefs, fromDbPrefs } from '../src/hooks/useWeeklyMenu.js';

function parseJsonFields(row: any) {
  return {
    ...row,
    daily_meal_structure:
      typeof row.daily_meal_structure === 'string'
        ? JSON.parse(row.daily_meal_structure)
        : row.daily_meal_structure,
    tag_preferences:
      typeof row.tag_preferences === 'string'
        ? JSON.parse(row.tag_preferences)
        : row.tag_preferences,
    common_menu_settings:
      typeof row.common_menu_settings === 'string'
        ? JSON.parse(row.common_menu_settings)
        : row.common_menu_settings,
  };
}

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
    const parsed = parseJsonFields(dbShape);
    expect(parsed.common_menu_settings).toEqual(prefs.commonMenuSettings);
    expect(parsed.daily_meal_structure).toEqual([
      ['petit-dejeuner', 'brunch'],
    ]);

    const restored = fromDbPrefs(parsed);
    expect(restored).toEqual(prefs);
  });

  it('defaults arrays when DB returns empty common_menu_settings', () => {
    const restored = fromDbPrefs({ common_menu_settings: {} });
    expect(restored.commonMenuSettings).toEqual({ enabled: false, linkedUsers: [], linkedUserRecipes: [] });
  });
});
