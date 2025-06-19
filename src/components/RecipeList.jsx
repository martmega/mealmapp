import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Star, Clock, Eye } from 'lucide-react';
import { RECIPE_CARD_COLORS_CLASSES } from '@/lib/colors';

const MemoizedRecipeCard = React.memo(function RecipeCard({
  recipe,
  color,
  onEdit,
  onDelete,
  onSelectRecipe,
}) {
  const handleCardClick = (e) => {
    if (e.target.closest('button')) {
      return;
    }
    onSelectRecipe(recipe);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`${color.bg} ${color.text} bg-opacity-80 dark:bg-opacity-80 rounded-xl p-5 shadow-pastel-soft hover:shadow-pastel-medium transition-shadow duration-300 ease-in-out flex flex-col h-full cursor-pointer group`}
      onClick={handleCardClick}
    >
      {recipe.image_url && (
        <div className="mb-3 aspect-[16/9] rounded-lg overflow-hidden">
          <img
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt={`Photo de ${recipe.name}`}
            src={recipe.image_url}
          />
        </div>
      )}
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="text-xl font-bold group-hover:text-pastel-text/90 transition-colors">
          {recipe.name}
        </h3>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectRecipe(recipe);
            }}
            title="Voir le détail"
            className={`h-8 w-8 hover:bg-pastel-highlight/20 ${color.text} hover:${color.text}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe);
            }}
            title="Modifier"
            className={`h-8 w-8 hover:bg-pastel-highlight/20 ${color.text} hover:${color.text}`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe.id);
            }}
            title="Supprimer"
            className={`h-8 w-8 text-destructive/70 hover:bg-destructive/30 hover:text-destructive-foreground`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {recipe.description && (
        <p
          className={`${color.text} opacity-80 mb-3 text-sm leading-relaxed flex-grow min-h-[50px]`}
        >
          {recipe.description.substring(0, 100)}
          {recipe.description.length > 100 ? '...' : ''}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {recipe.tags &&
          Array.isArray(recipe.tags) &&
          recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-[10px] ${color.text} bg-pastel-highlight/20 px-2.5 py-1 rounded-full font-medium`}
            >
              {tag}
            </span>
          ))}
        {recipe.tags &&
          Array.isArray(recipe.tags) &&
          recipe.tags.length > 3 && (
            <span
              className={`text-[10px] ${color.text} bg-pastel-highlight/20 px-2.5 py-1 rounded-full font-medium`}
            >
              +{recipe.tags.length - 3}
            </span>
          )}
      </div>
      <div className="mt-auto space-y-1.5 pt-3 border-t border-white/20">
        <div className="flex justify-between items-center text-xs opacity-90">
          <span className="flex items-center">
            <Star className="h-3.5 w-3.5 mr-1 text-yellow-300" />{' '}
            {recipe.servings} portions
          </span>
          <span className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-sky-300" />{' '}
            {recipe.calories || 'N/A'} calories
          </span>
        </div>
        {recipe.estimated_price !== undefined && (
          <div className="text-xs text-gray-500 mt-1">
            💰 Estimé : {recipe.estimated_price.toFixed(2)} €
          </div>
        )}
      </div>
    </motion.div>
  );
});

function RecipeList({ recipes, onEdit, onDelete, onSelectRecipe }) {
  const recipeColors = useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    return recipes.map(
      (_, index) =>
        RECIPE_CARD_COLORS_CLASSES[index % RECIPE_CARD_COLORS_CLASSES.length]
    );
  }, [recipes]);

  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
        <p className="text-xl text-pastel-muted-foreground">
          Aucune recette trouvée.
        </p>
        <p className="text-pastel-text/70">
          Commencez par ajouter une nouvelle recette !
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.isArray(recipes) &&
        recipes.map((recipe, index) => (
          <MemoizedRecipeCard
            key={recipe.id || index}
            recipe={recipe}
            color={recipeColors[index]}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelectRecipe={onSelectRecipe}
          />
        ))}
    </div>
  );
}

export default RecipeList;
