import { DEFAULT_MENU_PREFS } from '../src/lib/defaultPreferences.js';

export interface WeeklyMenuPreferences {
  portions_per_meal?: number;
  daily_calories_limit?: number | null;
  weekly_budget?: number;
  daily_meal_structure?: string | string[][] | any;
  tag_preferences?: string[] | string;
  common_menu_settings?: string | Record<string, any>;
}

export function fromDbPrefs(pref: any | null | undefined) {
  if (!pref) return { ...DEFAULT_MENU_PREFS };
  const dailyMealStructure =
    typeof pref.daily_meal_structure === 'string'
      ? JSON.parse(pref.daily_meal_structure || '[]')
      : pref.daily_meal_structure;
  const tagPreferences =
    typeof pref.tag_preferences === 'string'
      ? JSON.parse(pref.tag_preferences || '[]')
      : pref.tag_preferences;
  const commonMenuSettings =
    typeof pref.common_menu_settings === 'string'
      ? JSON.parse(pref.common_menu_settings || '{}')
      : pref.common_menu_settings;
  const meals = Array.isArray(dailyMealStructure)
    ? dailyMealStructure.map((types: string[], idx: number) => ({
        id: idx + 1,
        mealNumber: idx + 1,
        types: Array.isArray(types) ? types : [],
        enabled: true,
      }))
    : [];
  return {
    servingsPerMeal: pref.portions_per_meal ?? 4,
    maxCalories: pref.daily_calories_limit ?? 2200,
    weeklyBudget: pref.weekly_budget ?? 35,
    meals,
    tagPreferences: tagPreferences || [],
    commonMenuSettings: {
      ...DEFAULT_MENU_PREFS.commonMenuSettings,
      ...(commonMenuSettings || {}),
    },
  };
}

export function toDbPrefs(pref: any) {
  const effective = { ...DEFAULT_MENU_PREFS, ...(pref || {}) };
  return {
    portions_per_meal: effective.servingsPerMeal,
    daily_calories_limit: effective.maxCalories,
    weekly_budget: effective.weeklyBudget,
    daily_meal_structure: JSON.stringify(
      Array.isArray(effective.meals)
        ? effective.meals
            .filter((m: any) => m.enabled)
            .map((m: any) => (Array.isArray(m.types) ? m.types : []))
        : []
    ),
    tag_preferences: JSON.stringify(effective.tagPreferences || []),
    common_menu_settings: JSON.stringify(effective.commonMenuSettings ?? {}),
  } as WeeklyMenuPreferences;
}
