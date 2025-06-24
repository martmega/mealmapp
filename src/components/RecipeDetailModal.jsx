import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Clock, Users, Tag, ClipboardList, Soup } from 'lucide-react';
import { MEAL_TYPE_OPTIONS_MAP } from '@/lib/mealTypes';
import SignedImage from '@/components/SignedImage';
import { SUPABASE_BUCKETS } from '@/config/constants';

function RecipeDetailModal({ recipe, onClose, userProfile }) {
  const servingsPerMealPreference = useMemo(() => {
    if (!recipe) return 1;
    return userProfile?.preferences?.servingsPerMeal || recipe.servings || 1;
  }, [userProfile, recipe]);

  const scaleFactor = useMemo(() => {
    if (!recipe) return 1;
    const recipeBaseServings = recipe.servings || 1;
    const prefServings =
      (userProfile?.preferences?.servingsPerMeal > 0
        ? userProfile.preferences.servingsPerMeal
        : recipeBaseServings) || 1;
    return prefServings / recipeBaseServings;
  }, [servingsPerMealPreference, recipe, userProfile]);

  const scaledIngredients = useMemo(() => {
    if (!recipe || !recipe.ingredients) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      quantity:
        Math.round((parseFloat(ing.quantity) || 0) * scaleFactor * 100) / 100,
    }));
  }, [recipe, scaleFactor]);

  if (!recipe) return null;

  const getMealTypeLabel = (id) => MEAL_TYPE_OPTIONS_MAP[id] || id;

  const displayServings =
    servingsPerMealPreference > 0
      ? servingsPerMealPreference
      : recipe.servings || 1;
  const displayCalories = Math.round((recipe.calories || 0) * scaleFactor);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-[60] p-4 backdrop-blur-sm bg-black/20 dark:bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 text-pastel-text dark:text-neutral-100"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-6 border-b border-pastel-border flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-pastel-primary dark:text-pastel-primary-hover">
              {recipe.name}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-pastel-muted-foreground hover:bg-pastel-muted dark:hover:bg-pastel-muted/30 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </header>

          <div className="p-6 space-y-6 overflow-y-auto flex-grow">
            {recipe.description && (
              <div className="p-4 bg-pastel-card-alt rounded-lg">
                <p className="text-pastel-text leading-relaxed">
                  {recipe.description}
                </p>
                {typeof recipe.estimated_price === 'number' ? (
                  <p className="text-base text-gray-500 mt-2 text-center">
                    {
                      (() => {
                        const base = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
                        const planned = recipe.plannedServings || base;
                        const pricePerPortion = recipe.estimated_price / base;
                        const adjusted = pricePerPortion * planned;
                        return `${adjusted.toFixed(2)} €`;
                      })()
                    }
                  </p>
                ) : (
                  <p className="text-base text-gray-400 mt-2 text-center">Estimation indisponible</p>
                )}
              </div>
            )}

            {recipe.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden border border-pastel-border bg-pastel-muted/50">
                <SignedImage
                  bucket={SUPABASE_BUCKETS.recipes}
                  path={recipe.image_url}
                  alt={`Image de ${recipe.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-secondary dark:text-pastel-secondary-hover flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Portions
                </h3>
                <p className="text-pastel-text">{recipe.servings || 'N/A'}</p>
              </div>
              <div className="space-y-2 p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-secondary dark:text-pastel-secondary-hover flex items-center">
                  <Clock className="w-5 h-5 mr-2" /> Calories
                </h3>
                <p className="text-pastel-text">
                  {displayCalories} par portion (Base:{' '}
                  {recipe.calories || 'N/A'} par portion de base)
                </p>
              </div>
            </div>

            {recipe.meal_types && recipe.meal_types.length > 0 && (
              <div className="p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-tertiary dark:text-pastel-tertiary-hover flex items-center mb-2">
                  <Soup className="w-5 h-5 mr-2" /> Types de repas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.meal_types.map((type) => (
                    <span
                      key={type}
                      className="bg-pastel-tertiary/20 text-pastel-tertiary dark:text-pastel-tertiary-hover px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {getMealTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-accent dark:text-pastel-accent-hover flex items-center mb-2">
                  <Tag className="w-5 h-5 mr-2" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-pastel-accent/20 text-pastel-accent dark:text-pastel-accent-hover px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {scaledIngredients.length > 0 && (
              <div className="p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-primary dark:text-pastel-primary-hover flex items-center mb-3">
                  <ClipboardList className="w-5 h-5 mr-2" /> Ingrédients (pour{' '}
                  {displayServings} portions)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-pastel-text pl-2">
                  {scaledIngredients.map((ing, index) => (
                    <li key={index}>
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="p-4 bg-pastel-card-alt rounded-lg">
                <h3 className="text-lg font-semibold text-pastel-secondary dark:text-pastel-secondary-hover flex items-center mb-3">
                  <ClipboardList className="w-5 h-5 mr-2" /> Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-pastel-text pl-2">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <footer className="p-4 border-t border-pastel-border flex justify-end sticky bottom-0 bg-white dark:bg-zinc-900 z-10">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RecipeDetailModal;
