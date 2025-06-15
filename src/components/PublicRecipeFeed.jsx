import React from 'react';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/layout/LoadingScreen';
import RecipeList from '@/components/RecipeList';
import { usePublicRecipes } from '@/hooks/usePublicRecipes';

export default function PublicRecipeFeed({ session, onSelectRecipe }) {
  const { recipes, loadMore, loading, hasMore } = usePublicRecipes(session);

  return (
    <div className="space-y-6">
      {loading && recipes.length === 0 ? (
        <LoadingScreen message="Chargement des recettes publiques..." />
      ) : recipes.length > 0 ? (
        <RecipeList
          recipes={recipes}
          onEdit={() => {}}
          onDelete={() => {}}
          onSelectRecipe={onSelectRecipe}
        />
      ) : (
        <div className="flex items-center justify-center h-40 text-center">
          <p className="text-lg text-pastel-muted-foreground">
            Aucune recette publique à afficher pour le moment.
          </p>
        </div>
      )}
      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? 'Chargement...' : 'Voir plus'}
          </Button>
        </div>
      )}
    </div>
  );
}
