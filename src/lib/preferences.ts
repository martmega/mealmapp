import { DEFAULT_MENU_PREFS } from './defaultPreferences.js';
import type { WeeklyMenuPreferences, CommonMenuSettings } from '../types.js';

export function fromDbPrefs(pref: Partial<WeeklyMenuPreferences> | null | undefined) {
  if (!pref) return { ...DEFAULT_MENU_PREFS };
  const dailyMealStructure =
    typeof pref.daily_meal_structure === 'string'
      ? JSON.parse(pref.daily_meal_structure || '[]')
      : (pref.daily_meal_structure as any);
  const tagPreferences =
    typeof pref.tag_preferences === 'string'
      ? JSON.parse(pref.tag_preferences || '[]')
      : (pref.tag_preferences as any);
  const commonMenuSettings =
    typeof pref.common_menu_settings === 'string'
      ? JSON.parse(pref.common_menu_settings || '{}')
      : (pref.common_menu_settings as any);
  const meals = Array.isArray(dailyMealStructure)
    ? dailyMealStructure.map((types: any, idx: number) => ({
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
    tagPreferences: (tagPreferences as any[]) || [],
    commonMenuSettings: {
      ...DEFAULT_MENU_PREFS.commonMenuSettings,
      ...(commonMenuSettings || {}),
    },
  };
}

export function toDbPrefs(pref: {
  servingsPerMeal?: number;
  maxCalories?: number | null;
  weeklyBudget?: number;
  meals?: { id: number; mealNumber: number; types: string[]; enabled: boolean }[];
  tagPreferences?: string[];
  commonMenuSettings?: CommonMenuSettings;
}): Partial<WeeklyMenuPreferences> {
  const effective = { ...DEFAULT_MENU_PREFS, ...(pref || {}) } as any;
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
  };
}
