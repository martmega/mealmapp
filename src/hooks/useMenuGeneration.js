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

function getBaseRecipeId(id) {
  const str = id?.toString ? id.toString() : String(id);
  return str.startsWith('local_') ? str : str.split('_')[0];
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
      const baseId = getBaseRecipeId(r.id);
      recipeUsageCount[baseId] = 0;
    });

    const recipesByUser = {};
    const usedRecipesByUser = {};
    const uniqueRecipeCountsByUser = {};
    baseRecipes.forEach((r) => {
      const userId = r.sourceUserId || 'currentUser';
      if (!recipesByUser[userId]) {
        recipesByUser[userId] = [];
        usedRecipesByUser[userId] = new Set();
        uniqueRecipeCountsByUser[userId] = new Set();
      }
      recipesByUser[userId].push(r);
      uniqueRecipeCountsByUser[userId].add(getBaseRecipeId(r.id));
    });
    Object.keys(uniqueRecipeCountsByUser).forEach((u) => {
      uniqueRecipeCountsByUser[u] = uniqueRecipeCountsByUser[u].size;
    });

    const dailyCalorieTarget = preferences.maxCalories || 2200;

    const activeMealsPreferences =
      preferences.meals?.filter((m) => m.enabled) || [];
    const mealCount = activeMealsPreferences.length;
    const caloriePerMealApprox =
      mealCount > 0 ? dailyCalorieTarget / mealCount : dailyCalorieTarget;

    let totalSlotsToFill = days.length * activeMealsPreferences.length;

    // Determine participant weights for shared menus
    let participantSchedule = [];
    if (
      preferences.commonMenuSettings?.enabled &&
      Array.isArray(preferences.commonMenuSettings.linkedUsers) &&
      preferences.commonMenuSettings.linkedUsers.length > 0
    ) {
      const participants = preferences.commonMenuSettings.linkedUsers.map((u) => ({
        userId: u.id,
        ratio: typeof u.ratio === 'number' ? u.ratio : 0,
      }));

      const ratioSum = participants.reduce((sum, p) => sum + p.ratio, 0);
      const normalized = participants.map((p) => ({
        userId: p.userId,
        weight:
          ratioSum > 0
            ? p.ratio / ratioSum
            : 1 / participants.length,
      }));

      const quotaMap = {};
      let used = 0;
      const remainders = [];
      normalized.forEach((p) => {
        const exact = p.weight * totalSlotsToFill;
        const base = Math.floor(exact);
        quotaMap[p.userId] = base;
        used += base;
        remainders.push({ userId: p.userId, rem: exact - base });
      });

      remainders.sort((a, b) => b.rem - a.rem);
      let remaining = totalSlotsToFill - used;
      let idx = 0;
      while (remaining > 0) {
        const target = remainders[idx % remainders.length];
        quotaMap[target.userId] += 1;
        remaining -= 1;
        idx += 1;
      }

      const quotasLeft = { ...quotaMap };
      let lastUser = null;
      while (participantSchedule.length < totalSlotsToFill) {
        let candidates = Object.keys(quotasLeft).filter(
          (id) => quotasLeft[id] > 0 && id !== lastUser
        );
        if (candidates.length === 0) {
          candidates = Object.keys(quotasLeft).filter((id) => quotasLeft[id] > 0);
        }
        const chosen =
          candidates[Math.floor(Math.random() * candidates.length)];
        participantSchedule.push(chosen);
        quotasLeft[chosen] -= 1;
        lastUser = chosen;
      }
    }
    let participantIndex = 0;
    const weeklyBudget =
      preferences.weeklyBudget !== undefined
        ? preferences.weeklyBudget
        : userProfile?.preferences?.weeklyBudget ?? 0;
    let budgetUsed = 0;
    const avgBudgetPerSlot =
      weeklyBudget > 0 && totalSlotsToFill > 0
        ? weeklyBudget / totalSlotsToFill
        : 0;
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
        const targetUserId = participantSchedule[participantIndex] || null;
        participantIndex++;

        if (availableRecipes.length === 0 && baseRecipes.length > 0) {
          availableRecipes = shuffleArray(
            baseRecipes.filter(
              (r) =>
                recipeUsageCount[getBaseRecipeId(r.id)] < 3 &&
                !usedRecipeOriginalIdsThisDay.has(getBaseRecipeId(r.id))
            )
          );
        }
        if (availableRecipes.length === 0) {
          console.warn(
            `Plus de recettes disponibles pour le repas ${mealPreference.mealNumber} du jour ${days[dayIndex]}`
          );
          // Recharger la liste complète pour permettre les répétitions
          availableRecipes = shuffleArray(baseRecipes);
        }

        let bestRecipeForMeal = null;
        let bestRecipeScore = -1;

        let candidateRecipesForSlot = [];
        let candidateStageUsed = 0;

        let mealTypeFilteredRecipes = availableRecipes.filter((r) => {
          const recipeMealTypes = Array.isArray(r.meal_types) ? r.meal_types : [];
          const matchesType = mealPreference.types.some((prefType) =>
            recipeMealTypes.includes(prefType)
          );
          const matchesUser = !targetUserId || r.sourceUserId === targetUserId;
          return matchesType && matchesUser;
        });
        if (mealTypeFilteredRecipes.length === 0 && targetUserId) {
          mealTypeFilteredRecipes = availableRecipes.filter((r) => {
            const recipeMealTypes = Array.isArray(r.meal_types) ? r.meal_types : [];
            return mealPreference.types.some((prefType) =>
              recipeMealTypes.includes(prefType)
            );
          });
        }

        if (mealTypeFilteredRecipes.length === 0) {
          console.warn(
            `Aucune recette candidate (type de repas) pour le repas ${mealPreference.mealNumber} (${mealPreference.types.join(', ')}) le ${days[dayIndex]}`
          );
          const fallbackTypeRecipes = baseRecipes.filter((r) => {
            const recipeMealTypes = Array.isArray(r.meal_types) ? r.meal_types : [];
            return mealPreference.types.some((t) => recipeMealTypes.includes(t));
          });
          mealTypeFilteredRecipes =
            fallbackTypeRecipes.length > 0 ? fallbackTypeRecipes : baseRecipes;
        }

        const avoidDuplicates = mealTypeFilteredRecipes.length > 1;

        const candidateStages = [
          (r, baseId) =>
            (!avoidDuplicates ||
              (!usedRecipeOriginalIdsThisDay.has(baseId) &&
                recipeUsageCount[baseId] < 3)) &&
            (!usedRecipesByUser[r.sourceUserId].has(baseId) ||
              usedRecipesByUser[r.sourceUserId].size >=
                uniqueRecipeCountsByUser[r.sourceUserId]),
          (r, baseId) =>
            (!avoidDuplicates || !usedRecipeOriginalIdsThisDay.has(baseId)) &&
            (!usedRecipesByUser[r.sourceUserId].has(baseId) ||
              usedRecipesByUser[r.sourceUserId].size >=
                uniqueRecipeCountsByUser[r.sourceUserId]),
          () => true,
        ];

        for (let stage = 0; stage < candidateStages.length; stage++) {
          const filterFn = candidateStages[stage];
          candidateRecipesForSlot = [];
          if (mealTypeFilteredRecipes.length === 0) break;
          for (let i = 0; i < mealTypeFilteredRecipes.length; i++) {
            const recipe = mealTypeFilteredRecipes[i];
            const baseId = getBaseRecipeId(recipe.id);
            if (filterFn(recipe, baseId)) {
              const originalIndexInAvailable = availableRecipes.findIndex(
                (r) => r.id === recipe.id
              );
              candidateRecipesForSlot.push({
                recipe,
                originalIndexInAvailable,
              });
            }
          }
          if (candidateRecipesForSlot.length > 0) {
            candidateStageUsed = stage;
            break;
          }
        }

        const unusedCandidates = candidateRecipesForSlot.filter(({ recipe }) => {
          const baseId = getBaseRecipeId(recipe.id);
          return !usedRecipesByUser[recipe.sourceUserId].has(baseId);
        });
        if (unusedCandidates.length > 0) {
          candidateRecipesForSlot = unusedCandidates;
        }

        if (weeklyBudget > 0) {
          const remaining = weeklyBudget - budgetUsed;
          const withinBudget = candidateRecipesForSlot.filter(({ recipe }) => {
            if (typeof recipe.estimated_price !== 'number') return false;
            const base = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
            const mealCost = (recipe.estimated_price / base) * defaultServingsPerMealGlobal;
            return mealCost <= remaining;
          });
          if (withinBudget.length > 0) {
            candidateRecipesForSlot = withinBudget;
          }
        }

        for (const candidate of candidateRecipesForSlot) {
          const recipe = candidate.recipe;
          const baseId = getBaseRecipeId(recipe.id);
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

          const mealCost =
            typeof recipe.estimated_price === 'number'
              ? (recipe.estimated_price / recipeBaseServings) *
                defaultServingsPerMealGlobal
              : Infinity;
          if (weeklyBudget > 0) {
            if (mealCost > weeklyBudget - budgetUsed) {
              score *= 0.5;
            } else {
              score *= 1 + Math.max(0, avgBudgetPerSlot - mealCost) / avgBudgetPerSlot;
            }
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
          if (weeklyBudget > 0 && typeof bestRecipeForMeal.estimated_price === 'number') {
            const costPerPortion = bestRecipeForMeal.estimated_price / recipeBaseServings;
            budgetUsed += costPerPortion * defaultServingsPerMealGlobal;
          }
          dailyCalories += scaledCalories;
          const baseId = getBaseRecipeId(bestRecipeForMeal.id);
          usedRecipeOriginalIdsThisDay.add(baseId);
          recipeUsageCount[baseId] = (recipeUsageCount[baseId] || 0) + 1;
          usedRecipesByUser[bestRecipeForMeal.sourceUserId].add(baseId);

          const actualIndexInAvailable = availableRecipes.findIndex(
            (r) => r.id === bestRecipeForMeal.id
          );
          if (actualIndexInAvailable !== -1) {
            availableRecipes.splice(actualIndexInAvailable, 1);
          }
          if (
            recipeUsageCount[baseId] > 1 &&
            (recipeUsageCount[baseId] <= 3 || candidateStageUsed > 0)
          ) {
            availableRecipes.push(bestRecipeForMeal);
          }
        } else {
          console.warn(
            `Aucune recette trouvée pour le repas ${mealPreference.mealNumber} (${mealPreference.types.join(', ')}) le ${days[dayIndex]} après scoring.`
          );
          const fallbackPool =
            mealTypeFilteredRecipes.length > 0
              ? mealTypeFilteredRecipes
              : baseRecipes;
          if (fallbackPool.length > 0) {
            const fallbackRecipe = shuffleArray(fallbackPool)[0];
            const baseId = getBaseRecipeId(fallbackRecipe.id);
            const recipeBaseServings =
              fallbackRecipe.servings && fallbackRecipe.servings > 0
                ? fallbackRecipe.servings
                : 1;
            const scaleFactorForCalorieEst =
              defaultServingsPerMealGlobal / recipeBaseServings;
            const scaledCalories =
              (fallbackRecipe.calories || 0) * scaleFactorForCalorieEst;

            const recipeToAdd = {
              ...fallbackRecipe,
              mealNumber: mealPreference.mealNumber,
              plannedServings: defaultServingsPerMealGlobal,
            };

            newWeeklyMenu[dayIndex][mealPrefIndex].push(recipeToAdd);
            if (weeklyBudget > 0 && typeof fallbackRecipe.estimated_price === 'number') {
              const costPerPortion = fallbackRecipe.estimated_price / recipeBaseServings;
              budgetUsed += costPerPortion * defaultServingsPerMealGlobal;
            }
            dailyCalories += scaledCalories;
            usedRecipeOriginalIdsThisDay.add(baseId);
            recipeUsageCount[baseId] = (recipeUsageCount[baseId] || 0) + 1;
            usedRecipesByUser[fallbackRecipe.sourceUserId].add(baseId);
          }
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

    if (process.env.NODE_ENV === 'development') {
      days.forEach((dayName, idx) => {
        const menuForDay = Array.isArray(newWeeklyMenu[idx])
          ? newWeeklyMenu[idx]
          : [];
        console.log(`\u25B6\uFE0F ${dayName.toUpperCase()}`);
        console.log(
          'Repas 1 :',
          menuForDay[0]?.[0]?.name || '\u274C manquant'
        );
        console.log(
          'Repas 2 :',
          menuForDay[1]?.[0]?.name || '\u274C manquant'
        );
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
