import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DAY_COLORS_CLASSES, MEAL_BLOCK_OPACITY } from '@/lib/colors';
import { MEAL_TYPE_LABELS } from '@/lib/mealTypes';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, Users } from 'lucide-react';
import ServingsAdjuster from './ServingsAdjuster';

const MemoizedDailyMenu = React.memo(function DailyMenu({
  day,
  dayIndex,
  menuForDay,
  userProfile,
  onPlannedServingsChange,
  onReplaceRecipe,
  onDeleteRecipe,
}) {
  const defaultServingsPerMeal = useMemo(() => {
    const prefServings = userProfile?.preferences?.servingsPerMeal;
    return prefServings && prefServings > 0 ? prefServings : 4;
  }, [userProfile]);

  const dayColorStyle = DAY_COLORS_CLASSES[day] || {
    bg: 'bg-pastel-muted',
    text: 'text-pastel-text',
    hover: 'hover:bg-pastel-muted/90',
  };

  const safeMenuForDay = Array.isArray(menuForDay) ? menuForDay : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.05, duration: 0.3 }}
      className={`flex flex-col space-y-2.5 p-3 rounded-xl ${dayColorStyle.bg} ${dayColorStyle.text} min-h-[200px] shadow-pastel-soft`}
    >
      <h3 className="text-xl font-bold text-center tracking-tight">{day}</h3>
      {safeMenuForDay.length > 0 ? (
        <div className="space-y-2.5 flex-grow">
          {safeMenuForDay.map((mealRecipes, mealIndex) => {
            const safeMealRecipes = Array.isArray(mealRecipes)
              ? mealRecipes
              : [];
            if (safeMealRecipes.length === 0) return null;

            const mealTitle = `Repas ${safeMealRecipes[0]?.mealNumber || mealIndex + 1}`;

            return (
              <motion.div
                key={`meal-${mealIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: dayIndex * 0.05 + mealIndex * 0.03,
                  duration: 0.2,
                }}
                className={`rounded-lg p-2.5 space-y-1.5 bg-pastel-card ${MEAL_BLOCK_OPACITY[mealIndex + 1] || 'bg-opacity-10'} shadow-pastel-card-item`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pastel-text/90">
                    {mealTitle}
                  </h4>
                  <div className="flex items-center">
                    {safeMealRecipes.map((recipe, recipeIndex) => (
                      <React.Fragment
                        key={
                          recipe?.id
                            ? `actions-${recipe.id}-${recipeIndex}`
                            : `actions-recipe-${recipeIndex}`
                        }
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-pastel-text/70 hover:text-pastel-text hover:bg-pastel-highlight/20"
                          onClick={() =>
                            onReplaceRecipe(mealIndex, recipeIndex)
                          }
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/20"
                          onClick={() => onDeleteRecipe(mealIndex, recipeIndex)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {safeMealRecipes.map((recipe, recipeIndex) => {
                    if (!recipe || typeof recipe !== 'object') return null;

                    const plannedServings =
                      recipe.plannedServings || defaultServingsPerMeal;

                    let mealTypeDisplay = 'Type non défini';
                    const recipeMealTypes = Array.isArray(recipe.meal_types)
                      ? recipe.meal_types
                      : [];
                    if (recipeMealTypes.length > 0) {
                      mealTypeDisplay = recipeMealTypes
                        .map((mt) => MEAL_TYPE_LABELS[mt] || mt)
                        .join(' / ');
                    }

                    return (
                      <div
                        key={
                          recipe?.id
                            ? `${recipe.id}-${recipeIndex}`
                            : `recipe-${recipeIndex}`
                        }
                        className="space-y-0.5"
                      >
                        <p className="text-sm font-semibold leading-tight">
                          {recipe?.name || 'Recette inconnue'}
                        </p>
                        <div className="text-xs text-pastel-text/80">
                          <p>{mealTypeDisplay}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3.5 h-3.5 text-pastel-text/70 opacity-80" />
                          <ServingsAdjuster
                            servings={plannedServings}
                            onDecrease={() =>
                              onPlannedServingsChange(
                                mealIndex,
                                recipeIndex,
                                Math.max(1, plannedServings - 1)
                              )
                            }
                            onIncrease={() =>
                              onPlannedServingsChange(
                                mealIndex,
                                recipeIndex,
                                plannedServings + 1
                              )
                            }
                          />
                        </div>
                        {typeof recipe.estimated_price === 'number' && (
                          <p className="text-sm text-pastel-text/70 mt-0.5 text-center">
                            {
                              (() => {
                                const base =
                                  recipe.servings && recipe.servings > 0
                                    ? recipe.servings
                                    : 1;
                                const pricePerPortion =
                                  recipe.estimated_price / base;
                                const adjusted = pricePerPortion * plannedServings;
                                return `${adjusted.toFixed(2)} €`;
                              })()
                            }
                          </p>
                        )}
                        {recipeIndex < safeMealRecipes.length - 1 && (
                          <hr className="border-pastel-border/10 dark:border-gray-600 my-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: dayIndex * 0.05 + 0.1, duration: 0.2 }}
          className="rounded-lg p-3 text-center bg-pastel-card bg-opacity-10 flex-grow flex items-center justify-center min-h-[50px]"
        >
          <p className="text-xs opacity-70">Aucun repas prévu</p>
        </motion.div>
      )}
    </motion.div>
  );
});

export default MemoizedDailyMenu;
