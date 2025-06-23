import { normalizeIngredientName } from './ingredientNormalizer.js';

const INGREDIENT_TRANSLATIONS = {
  'oeuf': 'egg',
  'oeufs': 'eggs',
  'oeuf au plat': 'fried eggs',
  'oeufs au plat': 'fried eggs',
  'bacon': 'bacon',
  'pain de mie': 'bread',
  'pain': 'bread',
  'fromage': 'cheese',
  'lait': 'milk',
  'beurre': 'butter',
  'poulet': 'chicken',
  'pomme de terre': 'potato',
  'carotte': 'carrot',
  'tomate': 'tomato',
  'oignon': 'onion',
  "gousse d'ail": 'garlic',
  'ail': 'garlic',
  'riz': 'rice',
  'poivron': 'bell pepper',
  'courgette': 'zucchini',
};

const STOPWORDS = [
  'and',
  'with',
  'et',
  'au',
  'aux',
  'a',
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'un',
  'une',
  'en',
  'dish',
  'recipe',
  'plat',
  'recette',
];

const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const translateIngredient = (name) => {
  const normalized = normalizeIngredientName(name);
  return INGREDIENT_TRANSLATIONS[normalized] || normalized;
};

const translateDishName = (name) => {
  if (!name) return '';
  const parts = normalizeText(name).split(/,|\band\b|\bet\b|\bwith\b/).map((p) => p.trim()).filter(Boolean);
  const translatedParts = parts.map((p) => INGREDIENT_TRANSLATIONS[p] || p);
  if (translatedParts.length === 0) return name.trim();
  if (translatedParts.length === 1) return translatedParts[0];
  if (translatedParts.length === 2) return `${translatedParts[0]} with ${translatedParts[1]}`;
  const middle = translatedParts.slice(1, -1).join(', ');
  return `${translatedParts[0]} with ${middle ? middle + ' and ' : ''}${translatedParts[translatedParts.length - 1]}`;
};

const extractKeywordsFromText = (text) => {
  return normalizeText(text)
    .split(/[,\.\-;()\s]+/)
    .filter((word) => word && !STOPWORDS.includes(word))
    .slice(0, 5);
};

export const generateRecipeImagePrompt = (recipe) => {
  if (!recipe) return '';
  const dishName = translateDishName(recipe.name || recipe.description || '');

  let ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((i) => translateIngredient(i.name || '')).filter(Boolean)
    : [];

  if (ingredients.length === 0) {
    const text = recipe.description || recipe.name || '';
    ingredients = extractKeywordsFromText(text).map(translateIngredient);
  }

  const mainIngredients = Array.from(new Set(ingredients)).slice(0, 5);
  const ingredientList = mainIngredients.join(', ');

  const prompt = `A delicious and realistic photo of a home-cooked dish: ${dishName}. It includes: ${ingredientList}. Styled simply on a plate or in a pan. Lighting is natural and appetizing. Do not use a restaurant or gourmet aesthetic. Show the food clearly. No people, no logos, no text. Focus on realistic food presentation, homemade style.`;

  return prompt.replace(/\s+/g, ' ').trim();
};

export default generateRecipeImagePrompt;
