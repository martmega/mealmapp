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
  daily_meal_structure: string[];
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

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  /** Optional text description */
  description: string | null;
  servings: number;
  /** JSON structure of ingredients or null */
  ingredients: unknown | null;
  /** May be stored as raw text or JSON array */
  instructions: string | string[] | null;
  calories: number | null;
  meal_types: string[] | null;
  tags: string[] | null;
  visibility: string;
  image_url: string | null;
  estimated_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  user_id: string;
  name: string;
  /** 7 day menu array */
  menu_data: unknown;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuParticipant {
  menu_id: string;
  user_id: string;
}

export interface UserRelationship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AccessKey {
  id: string;
  key: string;
  grants: unknown | null;
  used_by: string | null;
  used_at: string | null;
}

export interface IaUsage {
  user_id: string;
  month: string;
  text_requests: number;
  image_requests: number;
}

export interface IaCredits {
  user_id: string;
  text_credits: number;
  image_credits: number;
  updated_at: string;
}
