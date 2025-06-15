export const INGREDIENT_VARIATIONS = {
  "oeuf": ["oeuf", "oeufs", "œuf", "œufs", "Oeuf", "Oeufs", "Œuf", "Œufs"],
  "oignon": ["oignon", "oignons", "Oignon", "Oignons"],
  "tomate": ["tomate", "tomates", "Tomate", "Tomates"],
  "carotte": ["carotte", "carottes", "Carotte", "Carottes"],
  "pomme de terre": ["pomme de terre", "pommes de terre", "Pomme de terre", "Pommes de terre"],
  "gousse d'ail": ["gousse d'ail", "gousses d'ail", "Gousse d'ail", "Gousses d'ail", "ail"],
  "poivron": ["poivron", "poivrons", "Poivron", "Poivrons"],
  "courgette": ["courgette", "courgettes", "Courgette", "Courgettes"],
};

export const normalizeIngredientName = (name) => {
  // Convertir en minuscules et supprimer les accents
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // Chercher dans les variations connues
  for (const [standard, variations] of Object.entries(INGREDIENT_VARIATIONS)) {
    if (variations.some(v => 
      v.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim() === normalized
    )) {
      return standard;
    }
  }

  return name.toLowerCase().trim();
};

export const normalizeUnit = (unit) => {
  const unitMap = {
    "g": ["g", "gr", "gramme", "grammes", "Gramme", "Grammes"],
    "kg": ["kg", "kilo", "kilos", "kilogramme", "kilogrammes"],
    "ml": ["ml", "millilitre", "millilitres"],
    "cl": ["cl", "centilitre", "centilitres"],
    "l": ["l", "L", "litre", "litres"],
    "cuillère à café": ["cuillère à café", "cuillères à café", "c. à café", "càc", "cc"],
    "cuillère à soupe": ["cuillère à soupe", "cuillères à soupe", "c. à soupe", "càs", "cs"],
    "pièce": ["pièce", "pièces", "piece", "pieces", "unité", "unités"],
    "tranche": ["tranche", "tranches"],
    "gousse": ["gousse", "gousses"],
  };

  const normalizedUnit = unit.toLowerCase().trim();
  
  for (const [standard, variations] of Object.entries(unitMap)) {
    if (variations.some(v => v.toLowerCase().trim() === normalizedUnit)) {
      return standard;
    }
  }

  return unit.toLowerCase().trim();
};

export const canCombineUnits = (unit1, unit2) => {
  const normalizedUnit1 = normalizeUnit(unit1);
  const normalizedUnit2 = normalizeUnit(unit2);
  
  // Même unité
  if (normalizedUnit1 === normalizedUnit2) return true;
  
  // Conversions possibles
  const convertiblePairs = [
    ['g', 'kg'],
    ['ml', 'cl', 'l'],
    ['pièce', 'unité'],
  ];
  
  return convertiblePairs.some(pair => 
    pair.includes(normalizedUnit1) && pair.includes(normalizedUnit2)
  );
};

export const convertQuantity = (quantity, fromUnit, toUnit) => {
  const conversions = {
    'kg': { 'g': 1000 },
    'g': { 'kg': 0.001 },
    'l': { 'ml': 1000, 'cl': 100 },
    'cl': { 'ml': 10, 'l': 0.01 },
    'ml': { 'cl': 0.1, 'l': 0.001 },
  };

  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return quantity;
  
  if (conversions[from]?.[to]) {
    return quantity * conversions[from][to];
  }
  if (conversions[to]?.[from]) {
    return quantity / conversions[to][from];
  }
  
  return quantity;
};