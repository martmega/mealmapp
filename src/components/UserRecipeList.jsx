import React from 'react';
import RecipeList from '@/components/RecipeList';

export default function UserRecipeList({ recipes, onSelectRecipe, onToast }) {
  return (
    <RecipeList
      recipes={recipes}
      onEdit={() => onToast?.('edit')}
      onDelete={() => onToast?.('delete')}
      onSelectRecipe={onSelectRecipe}
    />
  );
}
