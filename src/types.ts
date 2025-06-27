export type WeeklyMenuPreferences = {
  menu_id: string;
  portions_per_meal: number;
  daily_calories_limit: number;
  weekly_budget: number;
  daily_meal_structure: string[];
  meals: any[];
  tag_preferences: string[];
};
