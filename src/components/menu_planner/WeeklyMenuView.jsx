import React, { useState, useMemo } from 'react';
import DailyMenu from '@/components/DailyMenu';
import ReplaceRecipeModal from '@/components/menu_planner/ReplaceRecipeModal.jsx';
import { initialWeeklyMenuState, calculateMenuCost } from '@/lib/menu';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

function WeeklyMenuView({
  weeklyMenu = initialWeeklyMenuState(),
  setWeeklyMenu,
  safeRecipes = [],
  preferences,
  userProfile,
}) {
  const [isReplaceRecipeModalOpen, setIsReplaceRecipeModalOpen] =
    useState(false);
  const [recipeToReplaceInfo, setRecipeToReplaceInfo] = useState(null);
  const [searchTermModal, setSearchTermModal] = useState('');

  const handlePlannedServingsChange = (
    dayIndex,
    mealIndex,
    recipeIndex,
    newServings
  ) => {
    const updatedMenu = weeklyMenu.map((day) => day.map((meal) => [...meal]));
    if (updatedMenu[dayIndex]?.[mealIndex]?.[recipeIndex]) {
      updatedMenu[dayIndex][mealIndex][recipeIndex] = {
        ...updatedMenu[dayIndex][mealIndex][recipeIndex],
        plannedServings: parseInt(newServings, 10) || 1,
      };
      setWeeklyMenu(updatedMenu);
    }
  };

  const openReplaceRecipeModal = (dayIndex, mealIndex, recipeIndex) => {
    setRecipeToReplaceInfo({ dayIndex, mealIndex, recipeIndex });
    setIsReplaceRecipeModalOpen(true);
    setSearchTermModal('');
  };

  const handleSelectRecipeForReplacement = (newRecipe) => {
    if (!recipeToReplaceInfo) return;
    const { dayIndex, mealIndex, recipeIndex } = recipeToReplaceInfo;
    const updatedMenu = weeklyMenu.map((day) => day.map((meal) => [...meal]));

    const defaultPlannedServings =
      userProfile?.preferences?.servingsPerMeal ||
      preferences.portions_per_meal ||
      4;

    if (updatedMenu[dayIndex]?.[mealIndex]) {
      updatedMenu[dayIndex][mealIndex][recipeIndex] = {
        ...newRecipe,
        mealNumber:
          updatedMenu[dayIndex][mealIndex][recipeIndex]?.mealNumber ||
          mealIndex + 1,
        plannedServings: defaultPlannedServings,
      };
      setWeeklyMenu(updatedMenu);
    }
    setIsReplaceRecipeModalOpen(false);
    setRecipeToReplaceInfo(null);
  };

  const handleDeleteRecipeFromMeal = (dayIndex, mealIndex, recipeIndex) => {
    const updatedMenu = weeklyMenu.map((day) => day.map((meal) => [...meal]));
    if (updatedMenu[dayIndex]?.[mealIndex]) {
      updatedMenu[dayIndex][mealIndex].splice(recipeIndex, 1);
      setWeeklyMenu(updatedMenu);
    }
  };

  const filteredRecipesForModal = useMemo(() => {
    if (!recipeToReplaceInfo) return [];

    const { mealIndex } = recipeToReplaceInfo;
    const recipesToFilter = [...safeRecipes];

    const uniqueRecipeMap = new Map();
    recipesToFilter.forEach((r) => {
      if (r && r.id) uniqueRecipeMap.set(r.id, r);
    });
    const uniqueRecipes = Array.from(uniqueRecipeMap.values());

    return uniqueRecipes.filter((recipe) => {
      if (!recipe || !recipe.name) return false;
      const nameMatch = recipe.name
        .toLowerCase()
        .includes(searchTermModal.toLowerCase());
      return nameMatch;
    });
  }, [
    safeRecipes,
    recipeToReplaceInfo,
    searchTermModal,
  ]);

  const totalMenuCost = useMemo(
    () => calculateMenuCost(weeklyMenu),
    [weeklyMenu]
  );

  const weeklyBudget =
    preferences.weekly_budget !== undefined
      ? preferences.weekly_budget
      : userProfile?.preferences?.weeklyBudget ?? 0;
  const TOLERANCE = 0.1;
  const maxBudget = weeklyBudget * (1 + TOLERANCE);
  const overBudget = totalMenuCost > maxBudget && weeklyBudget > 0;

  return (
    <div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xxl:grid-cols-7">
        {DAYS.map((day, dayIdx) => (
          <DailyMenu
            key={day}
            day={day}
            dayIndex={dayIdx}
            menuForDay={
              Array.isArray(weeklyMenu) && weeklyMenu[dayIdx]
                ? weeklyMenu[dayIdx]
                : []
            }
            userProfile={userProfile}
            onPlannedServingsChange={(mealIdx, recipeIdx, newServings) =>
              handlePlannedServingsChange(
                dayIdx,
                mealIdx,
                recipeIdx,
                newServings
              )
            }
            onReplaceRecipe={(mealIdx, recipeIdx) =>
              openReplaceRecipeModal(dayIdx, mealIdx, recipeIdx)
            }
            onDeleteRecipe={(mealIdx, recipeIdx) =>
              handleDeleteRecipeFromMeal(dayIdx, mealIdx, recipeIdx)
            }
          />
        ))}
      </div>
      <ReplaceRecipeModal
        isOpen={isReplaceRecipeModalOpen}
        onOpenChange={setIsReplaceRecipeModalOpen}
        searchTerm={searchTermModal}
        onSearchTermChange={setSearchTermModal}
        filteredRecipes={filteredRecipesForModal}
        onSelectRecipe={handleSelectRecipeForReplacement}
        userProfile={userProfile}
      />
      <div className="mt-6 text-center font-medium">
        {weeklyBudget > 0 && (
          <p className={overBudget ? 'text-red-600' : 'text-green-600'}>
            {`Total estimé : ${totalMenuCost.toFixed(2)} € / Budget : ${weeklyBudget.toFixed(2)} € `}
            {overBudget
              ? `❌ (dépassement de +${(totalMenuCost - weeklyBudget).toFixed(2)} €)`
              : '✅'}
          </p>
        )}
        {weeklyBudget === 0 && (
          <p className="text-pastel-text/80">
            {`Total estimé : ${totalMenuCost.toFixed(2)} €`}
          </p>
        )}
      </div>
    </div>
  );
}

export default WeeklyMenuView;
