export const generateRecipeImagePrompt = (recipe) => {
  if (!recipe) return '';

  const name = recipe.name?.trim() || '';
  const ingredientNames = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((i) => i.name?.trim()).filter(Boolean)
    : [];
  const ingredients = ingredientNames.join(', ');

  const instructions = recipe.instructions
    ? String(recipe.instructions).slice(0, 200).replace(/\s+/g, ' ').trim()
    : '';

  let description = recipe.description?.trim() || '';
  if (description.endsWith('.')) {
    description = description.slice(0, -1);
  }

  const parts = [
    `Photographie d'un plat maison réaliste : ${name}.`,
    `Ingrédients visibles : ${ingredients}.`,
  ];

  if (instructions) {
    parts.push(`Instructions principales : ${instructions}.`);
  }

  if (description) {
    parts.push(`Description : ${description}.`);
  }

  parts.push(
    "Style : photo réaliste, plat simple, appétissant et rustique, fond neutre, assiette centrée, lumière naturelle. ",
    "Éviter toute décoration sophistiquée ou ingrédients absents, ne pas ajouter de poisson s'il n'y en a pas."
  );

  let prompt = parts.join(' ');
  prompt = prompt
    .replace(/artistic|gourmet|fine dining/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return prompt;
};

export default generateRecipeImagePrompt;
