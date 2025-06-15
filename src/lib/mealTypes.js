export const MEAL_TYPE_ORDER = [
  'petit-dejeuner',
  'entree',
  'plat',
  'dessert',
  'encas-sale',
  'encas-sucre',
];

export const MEAL_TYPE_LABELS = {
  'petit-dejeuner': 'Petit déjeuner',
  entree: 'Entrée',
  plat: 'Plat principal',
  dessert: 'Dessert',
  'encas-sucre': 'Encas sucré',
  'encas-sale': 'Encas salé',
};

export const MEAL_TYPE_OPTIONS_MAP = {
  'petit-dejeuner': 'Petit déjeuner',
  entree: 'Entrée',
  plat: 'Plat principal',
  dessert: 'Dessert',
  'encas-sucre': 'Encas sucré',
  'encas-sale': 'Encas salé',
};

export function getMealTypeForRecipe(recipe, mealPreferences) {
  if (!recipe?.meal_types?.length) return '';

  const matchingTypes = recipe.meal_types.filter((type) =>
    mealPreferences.types.includes(type)
  );

  if (matchingTypes.length === 0) {
    return MEAL_TYPE_LABELS[recipe.meal_types[0]] || recipe.meal_types[0];
  }

  const sortedTypes = matchingTypes.sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a) - MEAL_TYPE_ORDER.indexOf(b)
  );

  return sortedTypes.map((type) => MEAL_TYPE_LABELS[type] || type).join(' • ');
}
