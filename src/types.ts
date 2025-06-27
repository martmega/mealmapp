export type WeeklyMenuPreferences = {
  menu_id: string;
  portions_per_meal: number;
  daily_calories_limit: number | null;
  weekly_budget: number;
  daily_meal_structure: string[];
  tag_preferences: string[];
};
