create or replace function insert_default_preferences()
returns trigger
language plpgsql
as $$
begin
  insert into weekly_menu_preferences (
    menu_id,
    portions_per_meal,
    daily_calories_limit,
    weekly_budget,
    daily_meal_structure,
    tag_preferences,
    common_menu_settings
  ) values (
    new.id,
    4,
    2200,
    35,
    array[]::text[][],
    array[]::text[],
    case
      when new.is_shared then '{"enabled": false, "linkedUsers": [], "linkedUserRecipes": []}'::jsonb
      else '{}'::jsonb
    end
  );
  return new;
end;
$$;
