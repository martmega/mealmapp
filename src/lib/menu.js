export const initialWeeklyMenuState = () =>
  Array(7)
    .fill(null)
    .map(() => []);

/**
 * Calculate the total estimated cost of a weekly menu.
 * @param {Array} menu - Weekly menu data.
 * @param {Array} recipes - Optional array of recipe objects for lookups.
 * @returns {number} Total cost rounded to two decimals.
 */
export const calculateMenuCost = (menu, recipes = []) => {
  const recipeMap = new Map(
    (Array.isArray(recipes) ? recipes : []).map((r) => [r.id, r])
  );

  if (!Array.isArray(menu)) return 0;

  let total = 0;
  menu.forEach((day) => {
    if (!Array.isArray(day)) return;
    day.forEach((meal) => {
      if (!Array.isArray(meal)) return;
      meal.forEach((item) => {
        if (!item) return;
        const refRecipe =
          item.estimated_price !== undefined
            ? item
            : recipeMap.get(item.recipe_id || item.id);
        if (!refRecipe || refRecipe.estimated_price === undefined) return;
        const baseServings =
          refRecipe.servings && refRecipe.servings > 0 ? refRecipe.servings : 1;
        const portions =
          item.portions || item.plannedServings || refRecipe.servings || 1;
        total += (refRecipe.estimated_price / baseServings) * portions;
      });
    });
  });

  return Math.round(total * 100) / 100;
};
