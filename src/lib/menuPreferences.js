import { DEFAULT_MENU_PREFS } from './defaultPreferences.js';

/**
 * Convert a database row into client preferences.
 * @param {import('../types').WeeklyMenuPreferences | null | undefined} pref
 * @returns {{
 *   servingsPerMeal: number;
 *   maxCalories: number | null;
 *   weeklyBudget: number;
 *   meals: {id:number; mealNumber:number; types:string[]; enabled:boolean;}[];
 *   tagPreferences: string[];
 *   commonMenuSettings: import('../types').CommonMenuSettings;
 * }}
 */
export function fromDbPrefs(pref) {
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
    ? dailyMealStructure.map((types, idx) => ({
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

/**
 * Convert client preferences into a database row.
 * @param {{
 *   servingsPerMeal?: number;
 *   maxCalories?: number | null;
 *   weeklyBudget?: number;
 *   meals?: {id:number; mealNumber:number; types:string[]; enabled:boolean;}[];
 *   tagPreferences?: string[];
 *   commonMenuSettings?: import('../types').CommonMenuSettings;
 * }} pref
 * @returns {import('../types').WeeklyMenuPreferences}
 */
export function toDbPrefs(pref) {
  const effective = { ...DEFAULT_MENU_PREFS, ...(pref || {}) };
  return {
    portions_per_meal: effective.servingsPerMeal,
    daily_calories_limit: effective.maxCalories,
    weekly_budget: effective.weeklyBudget,
    daily_meal_structure: JSON.stringify(
      Array.isArray(effective.meals)
        ? effective.meals
            .filter((m) => m.enabled)
            .map((m) => (Array.isArray(m.types) ? m.types : []))
        : []
    ),
    tag_preferences: JSON.stringify(effective.tagPreferences || []),
    common_menu_settings: JSON.stringify(effective.commonMenuSettings ?? {}),
  };
}

