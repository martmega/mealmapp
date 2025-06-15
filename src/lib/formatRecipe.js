export function formatRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') {
    return recipe;
  }

  const { author, public_users, user, ...rest } = recipe;
  let formattedUser = user;

  if (author) {
    formattedUser = author;
  } else if (public_users) {
    formattedUser = public_users;
  }

  return { ...rest, user: formattedUser };
}

export function formatRecipes(rows) {
  return Array.isArray(rows) ? rows.map(formatRecipe) : [];
}
