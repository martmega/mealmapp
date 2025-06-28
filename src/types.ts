export interface CommonMenuSettings {
  enabled: boolean;
  linkedUsers?: string[];
  linkedUserRecipes?: string[];
}

export type WeeklyMenuPreferences = {
  menu_id: string;
  portions_per_meal: number;
  daily_calories_limit: number | null;
  weekly_budget: number;
  daily_meal_structure: string[][];
  tag_preferences: string[];
  /** Client side representation of meals */
  meals?: {
    id: number;
    mealNumber: number;
    types: string[];
    enabled: boolean;
  }[];
  /** Camel case tag preferences for generator */
  tagPreferences?: { tag: string; percentage: number }[] | string[];
  common_menu_settings?: CommonMenuSettings;
};
