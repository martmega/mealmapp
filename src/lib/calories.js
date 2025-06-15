// Base de données des calories pour 100g/100ml
export const CALORIES_DATABASE = {
  // Féculents
  "riz": 130,
  "pâtes": 131,
  "pomme de terre": 77,
  "farine": 364,
  "pain": 265,
  
  // Protéines
  "poulet": 165,
  "boeuf": 250,
  "porc": 242,
  "poisson": 206,
  "oeuf": 155,
  "tofu": 76,
  
  // Produits laitiers
  "lait": 42,
  "fromage": 402,
  "yaourt": 59,
  "crème": 195,
  "beurre": 717,
  
  // Légumes
  "carotte": 41,
  "tomate": 18,
  "oignon": 40,
  "poivron": 20,
  "courgette": 17,
  
  // Fruits
  "pomme": 52,
  "banane": 89,
  "orange": 47,
  
  // Autres
  "huile": 884,
  "sucre": 400,
  "miel": 304,
  "chocolat": 545
};

// Conversion des unités en grammes/millilitres
export const UNIT_CONVERSIONS = {
  "g": 1,
  "kg": 1000,
  "mg": 0.001,
  "ml": 1,
  "l": 1000,
  "cl": 10,
  "cuillère à soupe": 15,
  "cuillère à café": 5,
  "tasse": 250,
  "pincée": 1,
  "pièce": {
    "oeuf": 60,
    "pomme": 180,
    "banane": 120,
    "orange": 130,
    "oignon": 150,
    "tomate": 150,
    "poivron": 160,
    "courgette": 200
  }
};

export const calculateIngredientCalories = (ingredient) => {
  let quantity = parseFloat(ingredient.quantity);
  let unit = ingredient.unit.toLowerCase();
  let name = ingredient.name.toLowerCase();

  // Normaliser le nom pour la recherche
  const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Trouver les calories de base pour l'ingrédient
  let baseCalories = null;
  for (const [key, calories] of Object.entries(CALORIES_DATABASE)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedName.includes(normalizedKey)) {
      baseCalories = calories;
      break;
    }
  }

  if (!baseCalories) return 0;

  // Convertir la quantité en grammes/millilitres
  let grams = quantity;
  
  if (unit === "pièce" || unit === "pièces") {
    // Chercher la conversion pour l'unité "pièce"
    for (const [itemName, itemWeight] of Object.entries(UNIT_CONVERSIONS.pièce)) {
      const normalizedItemName = itemName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedName.includes(normalizedItemName)) {
        grams *= itemWeight;
        break;
      }
    }
  } else if (UNIT_CONVERSIONS[unit]) {
    if (typeof UNIT_CONVERSIONS[unit] === 'number') {
      grams *= UNIT_CONVERSIONS[unit];
    }
  }

  // Calculer les calories
  return Math.round((grams * baseCalories) / 100);
};

export const calculateTotalCalories = (ingredients, servings) => {
  const totalCalories = ingredients.reduce((sum, ingredient) => {
    return sum + calculateIngredientCalories(ingredient);
  }, 0);

  return Math.round(totalCalories / servings);
};