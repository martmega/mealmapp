import { useCallback, useState, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Custom hook to generate a weekly menu from recipes and user preferences.
 * @param {Array} recipes - Available recipe objects.
 * @param {Object} preferences - User preferences for menu generation.
 * @param {Function} setWeeklyMenu - State setter for the weekly menu.
 * @param {Object} userProfile - Current user profile.
 * @returns {{generateMenu: Function, isGenerating: boolean}}
 */
export function useMenuGeneration(
  recipes,
  preferences,
  setWeeklyMenu,
  userProfile
) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const defaultServingsPerMealGlobal = useMemo(() => {
    const prefServings = preferences?.servingsPerMeal;
    return prefServings && prefServings > 0
      ? prefServings
      : userProfile?.preferences?.servingsPerMeal > 0
        ? userProfile.preferences.servingsPerMeal
        : 4;
  }, [preferences, userProfile]);

  const generateMenu = useCallback(async () => {
    let baseRecipes = Array.isArray(recipes) ? recipes : [];

    if (
      preferences.commonMenuSettings?.enabled &&
      preferences.commonMenuSettings.linkedUserRecipes?.length > 0
    ) {
      const combined = [
        ...baseRecipes.map((r) => ({
          ...r,
          author: userProfile?.username || 'Moi',
          sourceUserId: userProfile?.id || 'currentUser',
        })),
        ...preferences.commonMenuSettings.linkedUserRecipes,
      ];
      baseRecipes = Array.from(
        new Map(combined.map((r) => [r.id, r])).values()
      ); // Deduplicate by id
    } else {
      baseRecipes = baseRecipes.map((r) => ({
        ...r,
        author: userProfile?.username || 'Moi',
        sourceUserId: userProfile?.id || 'currentUser',
      }));
    }

    if (!baseRecipes || baseRecipes.length === 0) {
      toast({
        title: 'Aucune recette disponible',
        description:
          'Veuillez ajouter des recettes ou lier des utilisateurs avec des recettes avant de générer un menu.',
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);

    const days = [
      'Lundi',
      'Mardi',
      'Mercredi',
      'Jeudi',
      'Vendredi',
      'Samedi',
      'Dimanche',
    ];
    let newWeeklyMenu = Array(7)
      .fill(null)
      .map(() => []);

    const shuffledRecipes = shuffleArray(baseRecipes);
    let availableRecipes = [...shuffledRecipes];
    const recipeUsageCount = {};
    baseRecipes.forEach((r) => {
      const baseId = r.id.split('_')[0];
      recipeUsageCount[baseId] = 0;
    });

    const dailyCalorieTarget = preferences.maxCalories || 2200;

    const activeMealsPreferences =
      preferences.meals?.filter((m) => m.enabled) || [];
    const mealCount = activeMealsPreferences.length;
    const caloriePerMealApprox =
      mealCount > 0 ? dailyCalorieTarget / mealCount : dailyCalorieTarget;

    let totalSlotsToFill = days.length * activeMealsPreferences.length;
    let recipesUsedCount = 0;

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      let dailyCalories = 0;
      let usedRecipeOriginalIdsThisDay = new Set();
      newWeeklyMenu[dayIndex] = Array(activeMealsPreferences.length)
        .fill(null)
        .map(() => []);

      for (
        let mealPrefIndex = 0;
        mealPrefIndex < activeMealsPreferences.length;
        mealPrefIndex++
      ) {
        const mealPreference = activeMealsPreferences[mealPrefIndex];

        if (availableRecipes.length === 0 && baseRecipes.length > 0) {
          availableRecipes = shuffleArray(
            baseRecipes.filter(
              (r) =>
                recipeUsageCount[r.id.split('_')[0]] < 3 &&
                !usedRecipeOriginalIdsThisDay.has(r.id.split('_')[0])
            )
          );
        }
        if (availableRecipes.length === 0) {
          console.warn(
            `Plus de recettes disponibles pour le repas ${mealPreference.mealNumber} du jour ${days[dayIndex]}`
          );
          break;
        }

        let bestRecipeForMeal = null;
        let bestRecipeScore = -1;

        let candidateRecipesForSlot = [];
        let candidateStageUsed = 0;

        const candidateStages = [
          (r, baseId, matchesMealType) =>
            !usedRecipeOriginalIdsThisDay.has(baseId) &&
            recipeUsageCount[baseId] < 3 &&
            matchesMealType,
          (r, baseId, matchesMealType) =>
            !usedRecipeOriginalIdsThisDay.has(baseId) && matchesMealType,
          (r, baseId, matchesMealType) => matchesMealType,
          (r, baseId) => !usedRecipeOriginalIdsThisDay.has(baseId),
          () => true,
        ];

        for (let stage = 0; stage < candidateStages.length; stage++) {
          const filterFn = candidateStages[stage];
          candidateRecipesForSlot = [];
          if (availableRecipes.length === 0) {
            availableRecipes = shuffleArray(baseRecipes);
          }
          for (let i = 0; i < availableRecipes.length; i++) {
            const recipe = availableRecipes[i];
            const baseId = recipe.id.split('_')[0];
            const recipeMealTypes = recipe.meal_types || [];
            const matchesMealType = mealPreference.types.some((prefType) =>
              recipeMealTypes.includes(prefType)
            );
            if (filterFn(recipe, baseId, matchesMealType)) {
              candidateRecipesForSlot.push({
                recipe,
                originalIndexInAvailable: i,
              });
            }
          }
          if (candidateRecipesForSlot.length > 0) {
            candidateStageUsed = stage;
            break;
          }
        }

        if (candidateRecipesForSlot.length === 0) {
          console.warn(
            `Aucune recette candidate (type de repas) pour le repas ${mealPreference.mealNumber} (${mealPreference.types.join(', ')}) le ${days[dayIndex]}`
          );
          continue;
        }

        for (const candidate of candidateRecipesForSlot) {
          const recipe = candidate.recipe;
          const baseId = recipe.id.split('_')[0];
          let score = 1 + Math.random() * 0.2;
          const timesUsed = recipeUsageCount[baseId] || 0;
          score /= 1 + timesUsed * 0.5;

          const recipeBaseServings =
            recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
          const scaleFactorForCalorieEst =
            defaultServingsPerMealGlobal / recipeBaseServings;
          const scaledCalories =
            (recipe.calories || 0) * scaleFactorForCalorieEst;

          const calorieDifference = Math.abs(
            scaledCalories - caloriePerMealApprox
          );
          score += 1 / (1 + calorieDifference / 100);

          if (
            preferences.tagPreferences &&
            preferences.tagPreferences.length > 0
          ) {
            const tagMatchScore = preferences.tagPreferences.reduce(
              (acc, tagPref) => {
                if ((recipe.tags || []).includes(tagPref.tag)) {
                  return acc + tagPref.percentage / 100;
                }
                return acc;
              },
              0
            );
            score += tagMatchScore;
          }

          if (
            dailyCalories + scaledCalories > dailyCalorieTarget + 200 &&
            mealPreference.mealNumber > 1
          ) {
            score *= 0.7;
          }

          if (
            preferences.commonMenuSettings?.enabled &&
            preferences.commonMenuSettings.linkedUsers?.length > 0
          ) {
            const totalRatioSum =
              preferences.commonMenuSettings.linkedUsers.reduce(
                (sum, u) => sum + u.ratio,
                0
              );
            const userSetting = preferences.commonMenuSettings.linkedUsers.find(
              (u) => u.id === recipe.sourceUserId
            );
            if (userSetting && totalRatioSum > 0) {
              const normalizedRatio = userSetting.ratio / totalRatioSum;
              score *= 1 + normalizedRatio; // Poids plus important pour les ratios plus élevés
            } else if (
              userSetting &&
              totalRatioSum === 0 &&
              preferences.commonMenuSettings.linkedUsers.length === 1
            ) {
              score *= 1.5; // Si un seul utilisateur et ratio 0, on le favorise quand même un peu
            }
          }

          if (score > bestRecipeScore) {
            bestRecipeScore = score;
            bestRecipeForMeal = recipe;
          }
        }

        if (bestRecipeForMeal) {
          recipesUsedCount++;
          const recipeBaseServings =
            bestRecipeForMeal.servings && bestRecipeForMeal.servings > 0
              ? bestRecipeForMeal.servings
              : 1;
          const scaleFactorForCalorieEst =
            defaultServingsPerMealGlobal / recipeBaseServings;
          const scaledCalories =
            (bestRecipeForMeal.calories || 0) * scaleFactorForCalorieEst;

          const recipeToAdd = {
            ...bestRecipeForMeal,
            mealNumber: mealPreference.mealNumber,
            plannedServings: defaultServingsPerMealGlobal,
          };

          newWeeklyMenu[dayIndex][mealPrefIndex].push(recipeToAdd);
          dailyCalories += scaledCalories;
          const baseId = bestRecipeForMeal.id.split('_')[0];
          usedRecipeOriginalIdsThisDay.add(baseId);
          recipeUsageCount[baseId] = (recipeUsageCount[baseId] || 0) + 1;

          const actualIndexInAvailable = availableRecipes.findIndex(
            (r) => r.id === bestRecipeForMeal.id
          );
          if (actualIndexInAvailable !== -1) {
            availableRecipes.splice(actualIndexInAvailable, 1);
          }
          if (recipeUsageCount[baseId] < 3 || candidateStageUsed > 0) {
            availableRecipes.push(bestRecipeForMeal);
          }
        } else {
          console.warn(
            `Aucune recette trouvée pour le repas ${mealPreference.mealNumber} (${mealPreference.types.join(', ')}) le ${days[dayIndex]} après scoring.`
          );
        }
      }
    }

    if (
      recipesUsedCount < totalSlotsToFill &&
      baseRecipes.length > 0 &&
      totalSlotsToFill > 0
    ) {
      toast({
        title: 'Moins de recettes que de créneaux',
        description:
          "Certains repas n'ont pas pu être remplis. Essayez d'ajouter plus de recettes ou d'ajuster vos préférences.",
        variant: 'default',
        duration: 7000,
      });
    }

    setWeeklyMenu(newWeeklyMenu);
    setIsGenerating(false);
    toast({
      title: 'Menu généré',
      description: 'Le menu hebdomadaire a été mis à jour.',
    });
  }, [
    recipes,
    preferences,
    setWeeklyMenu,
    toast,
    defaultServingsPerMealGlobal,
    userProfile,
  ]);

  return { generateMenu, isGenerating };
}
