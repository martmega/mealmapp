ALTER TABLE weekly_menu_preferences
  ALTER COLUMN daily_meal_structure TYPE text[][]
  USING (
    CASE
      WHEN daily_meal_structure IS NULL THEN ARRAY[]::text[][]
      ELSE ARRAY(SELECT ARRAY(v) FROM unnest(daily_meal_structure) AS v)
    END
  );
