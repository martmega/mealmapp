import { DEFAULT_MENU_PREFS } from './defaultPreferences.js';
import type { WeeklyMenuPreferences, CommonMenuSettings } from '@/types';

export interface ClientMenuPreferences {
  servingsPerMeal: number;
  maxCalories: number | null;
  weeklyBudget: number;
  meals: { id: number; mealNumber: number; types: string[]; enabled: boolean }[];
  tagPreferences: string[];
  commonMenuSettings: CommonMenuSettings;
}

/** Coerce unknown input into a string array */
export function asTextArray(input: unknown): string[] {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      return asTextArray(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  if (Array.isArray(input)) {
    return input
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v === null || v === undefined) return null;
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        return null;
      })
      .filter((v): v is string => typeof v === 'string');
  }

  return [];
}

/** Coerce unknown input into a 2D string array */
export function as2DTextArray(input: unknown): string[][] {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      return as2DTextArray(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }

  if (Array.isArray(input)) {
    return input.map((v) => asTextArray(v));
  }

  return [];
}

export function fromDbPrefs(
  pref: WeeklyMenuPreferences | null | undefined
): ClientMenuPreferences {
  if (!pref) return { ...DEFAULT_MENU_PREFS };

  const dailyMealStructure = as2DTextArray(pref.daily_meal_structure);
  const tagPreferences = asTextArray(pref.tag_preferences);

  const commonMenuSettings =
    typeof pref.common_menu_settings === 'string'
      ? JSON.parse(pref.common_menu_settings || '{}')
      : pref.common_menu_settings;

  const meals = dailyMealStructure.map((types: string[], idx: number) => ({
    id: idx + 1,
    mealNumber: idx + 1,
    types,
    enabled: true,
  }));

  return {
    servingsPerMeal: pref.portions_per_meal ?? 4,
    maxCalories: pref.daily_calories_limit ?? 2200,
    weeklyBudget: pref.weekly_budget ?? 35,
    meals,
    tagPreferences,
    commonMenuSettings: {
      ...DEFAULT_MENU_PREFS.commonMenuSettings,
      ...((commonMenuSettings as CommonMenuSettings) || {}),
    },
  };
}

export function toDbPrefs(pref: {
  servingsPerMeal?: number;
  maxCalories?: number | null;
  weeklyBudget?: number;
  meals?: {
    id: number;
    mealNumber: number;
    types: string[];
    enabled: boolean;
  }[];
  tagPreferences?: string[];
  commonMenuSettings?: CommonMenuSettings;
}): Omit<WeeklyMenuPreferences, 'menu_id'> {
  const effective = { ...DEFAULT_MENU_PREFS, ...(pref || {}) } as ClientMenuPreferences;
  return {
    portions_per_meal: effective.servingsPerMeal,
    daily_calories_limit: effective.maxCalories,
    weekly_budget: effective.weeklyBudget,
    daily_meal_structure: as2DTextArray(
      Array.isArray(effective.meals)
        ? effective.meals
            .filter((m) => m.enabled)
            .map((m) => (Array.isArray(m.types) ? m.types : []))
        : []
    ),
    tag_preferences: asTextArray(effective.tagPreferences),
    common_menu_settings: effective.commonMenuSettings ?? {},
  };
}
