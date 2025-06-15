export function formatRecipe(row) {
  if (!row || typeof row !== 'object') return row;
  const user =
    row.user ||
    row.author ||
    row.public_users ||
    null;
  const formatted = { ...row, user };
  delete formatted.author;
  delete formatted.public_users;
  return formatted;
}
