import { supabase } from '@/lib/supabase';

const COMMON_TAGS = {
  'petit-dejeuner': [
    'petit déjeuner',
    'brunch',
    'matinal',
    'rapide',
    'healthy',
  ],
  entree: ['entrée', 'apéritif', 'starter', 'léger', 'convivial'],
  plat: ['plat principal', 'repas', 'dîner', 'consistant', 'familial'],
  dessert: ['dessert', 'sucré', 'pâtisserie', 'gourmand', 'fruité'],
  'encas-sucre': ['goûter', 'collation', 'snack', 'rapide', 'énergétique'],
  'encas-sale': ['apéritif', 'snack', 'grignotage', 'salé', 'rapide'],
};

const INGREDIENT_BASED_TAGS = {
  chocolat: ['chocolat', 'dessert', 'pâtisserie', 'gourmand'],
  farine: ['boulangerie', 'pâtisserie', 'gâteau', 'pain'],
  oeuf: ['omelette', 'protéines', 'brunch', 'quiche'],
  lait: ['produit laitier', 'crémeux', 'doux'],
  fromage: ['fromage', 'gratiné', 'fondu', 'salé'],
  poulet: ['poulet', 'volaille', 'viande blanche', 'protéines'],
  boeuf: ['boeuf', 'viande rouge', 'grillé', 'mijote'],
  porc: ['porc', 'charcuterie', 'rôti'],
  poisson: ['poisson', 'fruits de mer', 'iodé', 'oméga 3'],
  saumon: ['saumon', 'poisson gras', 'fumé', 'grillé'],
  crevette: ['crevette', 'fruits de mer', 'apéritif'],
  légume: ['végétarien', 'healthy', 'vitamines', 'accompagnement'],
  carotte: ['carotte', 'légume racine', 'doux'],
  courgette: ['courgette', "légume d'été", 'gratin'],
  'pomme de terre': ['pomme de terre', 'féculent', 'frites', 'purée'],
  fruit: ['fruité', 'vitaminé', 'dessert', 'salade de fruits'],
  pomme: ['pomme', 'tarte', 'compote', 'croquant'],
  banane: ['banane', 'smoothie', 'énergétique'],
  pâtes: ['italien', 'pâtes', 'rapide', 'facile'],
  riz: ['céréales', 'asiatique', 'accompagnement', 'risotto'],
  tomate: ['méditerranéen', 'sauce', 'salade', 'italien'],
  oignon: ['oignon', 'base culinaire', 'aromatique'],
  ail: ['ail', 'condiment', 'parfumé'],
  'herbes de provence': ['herbes de provence', 'méditerranéen', 'aromatique'],
  basilic: ['basilic', 'italien', 'pesto', 'frais'],
  curry: ['curry', 'indien', 'épicé', 'exotique'],
  épices: ['épicé', 'relevé', 'parfumé'],
  végétarien: ['végétarien', 'sans viande', 'healthy'],
  vegan: ['vegan', 'sans produits animaux', 'végétal'],
  'sans gluten': ['sans gluten', 'coeliaque'],
  rapide: ['rapide', 'express', 'moins de 30 min'],
  facile: ['facile', 'débutant', 'simple'],
  healthy: ['healthy', 'sain', 'équilibré', 'léger'],
  économique: ['économique', 'petit budget'],
  convivial: ['convivial', 'partage', 'grandes tablées'],
  original: ['original', 'créatif', 'insolite'],
  traditionnel: ['traditionnel', 'classique', 'recette de grand-mère'],
};

export const generateTagSuggestions = async (
  recipe,
  existingSystemTags = []
) => {
  let suggestions = new Set(existingSystemTags);

  recipe.mealTypes?.forEach((type) => {
    if (COMMON_TAGS[type]) {
      COMMON_TAGS[type].forEach((tag) => suggestions.add(tag.toLowerCase()));
    }
  });

  recipe.ingredients?.forEach((ingredient) => {
    const ingredientName = ingredient.name.toLowerCase();
    Object.entries(INGREDIENT_BASED_TAGS).forEach(([key, tags]) => {
      if (ingredientName.includes(key.toLowerCase())) {
        tags.forEach((tag) => suggestions.add(tag.toLowerCase()));
      }
    });
  });

  const recipeNameLower = recipe.name?.toLowerCase() || '';
  Object.entries(INGREDIENT_BASED_TAGS).forEach(([key, tags]) => {
    if (recipeNameLower.includes(key.toLowerCase())) {
      tags.forEach((tag) => suggestions.add(tag.toLowerCase()));
    }
  });

  try {
    const { data: recipesData, error: dbError } = await supabase
      .from('recipes')
      .select('tags')
      .not('tags', 'is', null)
      .limit(50);

    if (dbError) {
      console.error('Erreur Supabase (récupération tags populaires):', dbError);
    } else if (recipesData) {
      const popularTags = recipesData
        .flatMap((r) => r.tags || [])
        .reduce((acc, tag) => {
          const lowerTag = tag.toLowerCase();
          acc[lowerTag] = (acc[lowerTag] || 0) + 1;
          return acc;
        }, {});

      Object.entries(popularTags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([tag]) => suggestions.add(tag));
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tags populaires:', error);
  }

  return Array.from(suggestions).sort();
};
