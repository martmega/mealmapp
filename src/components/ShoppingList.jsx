import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  normalizeIngredientName, 
  normalizeUnit, 
  canCombineUnits, 
  convertQuantity 
} from "@/lib/ingredientNormalizer";

function ShoppingList({ weeklyMenu, recipes, userProfile }) { // recipes prop is not strictly needed here if weeklyMenu contains full recipe details
  
  const defaultServingsPerMeal = useMemo(() => {
    const prefServings = userProfile?.preferences?.servingsPerMeal;
    return (prefServings && prefServings > 0) ? prefServings : 4; 
  }, [userProfile]);

  const calculateIngredients = () => {
    const ingredientsMap = {};

    if (!weeklyMenu || weeklyMenu.length === 0) {
      return [];
    }

    weeklyMenu.forEach((dayMeals) => { // dayMeals is an array of meals for the day
      if (!Array.isArray(dayMeals)) return;
      dayMeals.forEach((mealRecipes) => { // mealRecipes is an array of recipes for a specific meal
        if (!Array.isArray(mealRecipes)) return;
        mealRecipes.forEach((recipeDetails) => { // recipeDetails is a single recipe object
          if (!recipeDetails || !recipeDetails.id || !recipeDetails.ingredients) return;

          const plannedServings = recipeDetails.plannedServings || defaultServingsPerMeal;
          const recipeBaseServings = (recipeDetails.servings && recipeDetails.servings > 0) ? recipeDetails.servings : 1;
          const scaleFactor = plannedServings / recipeBaseServings;

          recipeDetails.ingredients.forEach((ingredient) => {
            if (!ingredient.name || !ingredient.quantity) return;

            const normalizedName = normalizeIngredientName(ingredient.name);
            const normalizedUnit = normalizeUnit(ingredient.unit);
            let quantity = parseFloat(ingredient.quantity) || 0;
            
            quantity *= scaleFactor;

            const key = `${normalizedName}|${normalizedUnit}`;

            if (ingredientsMap[key]) {
              ingredientsMap[key].quantity += quantity;
            } else {
              let combined = false;
              for (const existingKey in ingredientsMap) {
                const [existingName, existingUnit] = existingKey.split('|');
                if (existingName === normalizedName && canCombineUnits(existingUnit, normalizedUnit)) {
                  const convertedQuantity = convertQuantity(quantity, normalizedUnit, existingUnit);
                  ingredientsMap[existingKey].quantity += convertedQuantity;
                  combined = true;
                  break;
                }
              }
              if (!combined) {
                ingredientsMap[key] = {
                  name: ingredient.name, 
                  quantity: quantity,
                  unit: normalizedUnit,
                };
              }
            }
          });
        });
      });
    });
    return Object.values(ingredientsMap);
  };

  const shoppingList = useMemo(calculateIngredients, [weeklyMenu, defaultServingsPerMeal]);

  const sortedShoppingList = useMemo(() => {
    return [...shoppingList].sort((a, b) => a.name.localeCompare(b.name));
  }, [shoppingList]);

  return (
    <div className="section-card">
      <h2 className="text-2xl sm:text-3xl font-bold text-pastel-primary mb-6">Liste de courses</h2>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto bg-pastel-card-alt p-6 rounded-lg shadow-pastel-card-item"
      >
        {sortedShoppingList.length > 0 ? (
          <ul className="space-y-2.5">
            {sortedShoppingList.map((item, index) => (
              <motion.li
                key={`${item.name}-${item.unit}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className="flex justify-between items-center p-3 bg-pastel-card hover:bg-pastel-highlight rounded-lg shadow-pastel-soft transition-colors"
              >
                <span className="text-pastel-text/90">{item.name}</span>
                <span className="font-medium text-pastel-primary">
                  {Math.round(item.quantity * 100) / 100} {item.unit}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-pastel-muted-foreground py-8">
            Votre liste de courses est vide.
            <br />
            Générez un menu ou ajoutez des recettes pour la remplir !
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default ShoppingList;