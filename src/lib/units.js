export const INGREDIENT_TYPES = {
  LIQUIDE: 'liquide',
  SOLIDE: 'solide',
  EPICE: 'epice',
  UNITE: 'unite',
};

export const COMMON_UNITS = {
  [INGREDIENT_TYPES.LIQUIDE]: [
    { value: 'ml', label: 'Millilitres (ml)' },
    { value: 'cl', label: 'Centilitres (cl)' },
    { value: 'l', label: 'Litres (l)' },
    { value: 'cuillère à soupe', label: 'Cuillère à soupe' },
    { value: 'cuillère à café', label: 'Cuillère à café' },
    { value: 'tasse', label: 'Tasse' },
    { value: 'verre', label: 'Verre' },
  ],
  [INGREDIENT_TYPES.SOLIDE]: [
    { value: 'g', label: 'Grammes (g)' },
    { value: 'kg', label: 'Kilogrammes (kg)' },
    { value: 'pièce', label: 'Pièce(s)' },
    { value: 'cuillère à soupe', label: 'Cuillère à soupe' },
    { value: 'tasse', label: 'Tasse' },
  ],
  [INGREDIENT_TYPES.EPICE]: [
    { value: 'g', label: 'Grammes (g)' },
    { value: 'cuillère à café', label: 'Cuillère à café' },
    { value: 'pincée', label: 'Pincée(s)' },
  ],
  [INGREDIENT_TYPES.UNITE]: [
    { value: 'pièce', label: 'Pièce(s)' },
    { value: 'tranche', label: 'Tranche(s)' },
    { value: 'feuille', label: 'Feuille(s)' },
    { value: 'gousse', label: 'Gousse(s)' },
  ],
};

export const INGREDIENT_CATEGORIES = {
  // Liquides
  eau: INGREDIENT_TYPES.LIQUIDE,
  lait: INGREDIENT_TYPES.LIQUIDE,
  huile: INGREDIENT_TYPES.LIQUIDE,
  crème: INGREDIENT_TYPES.LIQUIDE,
  jus: INGREDIENT_TYPES.LIQUIDE,
  vinaigre: INGREDIENT_TYPES.LIQUIDE,
  sauce: INGREDIENT_TYPES.LIQUIDE,
  vin: INGREDIENT_TYPES.LIQUIDE,
  bouillon: INGREDIENT_TYPES.LIQUIDE,
  sirop: INGREDIENT_TYPES.LIQUIDE,

  // Épices et assaisonnements
  sel: INGREDIENT_TYPES.EPICE,
  poivre: INGREDIENT_TYPES.EPICE,
  curry: INGREDIENT_TYPES.EPICE,
  paprika: INGREDIENT_TYPES.EPICE,
  cannelle: INGREDIENT_TYPES.EPICE,
  muscade: INGREDIENT_TYPES.EPICE,
  cumin: INGREDIENT_TYPES.EPICE,
  basilic: INGREDIENT_TYPES.EPICE,
  thym: INGREDIENT_TYPES.EPICE,
  romarin: INGREDIENT_TYPES.EPICE,
  origan: INGREDIENT_TYPES.EPICE,
  persil: INGREDIENT_TYPES.EPICE,

  // Unités spécifiques
  oeuf: INGREDIENT_TYPES.UNITE,
  oignon: INGREDIENT_TYPES.UNITE,
  "gousse d'ail": INGREDIENT_TYPES.UNITE,
  citron: INGREDIENT_TYPES.UNITE,
  orange: INGREDIENT_TYPES.UNITE,
  pomme: INGREDIENT_TYPES.UNITE,
  banane: INGREDIENT_TYPES.UNITE,
  tomate: INGREDIENT_TYPES.UNITE,
  carotte: INGREDIENT_TYPES.UNITE,
  poivron: INGREDIENT_TYPES.UNITE,
  courgette: INGREDIENT_TYPES.UNITE,
  aubergine: INGREDIENT_TYPES.UNITE,
  pain: INGREDIENT_TYPES.UNITE,
  baguette: INGREDIENT_TYPES.UNITE,
  feuille: INGREDIENT_TYPES.UNITE,

  // Par défaut, tout le reste est considéré comme solide
  DEFAULT: INGREDIENT_TYPES.SOLIDE,
};

export const getIngredientType = (ingredientName) => {
  const nameLower = ingredientName.toLowerCase();
  for (const [key, type] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (nameLower.includes(key)) {
      return type;
    }
  }
  return INGREDIENT_CATEGORIES.DEFAULT;
};

export const getSuggestedUnits = (ingredientName) => {
  const type = getIngredientType(ingredientName);
  return COMMON_UNITS[type] || COMMON_UNITS[INGREDIENT_TYPES.SOLIDE];
};
