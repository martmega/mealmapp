import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { RotateCw } from 'lucide-react';
import MenuPreferencesModal from '@/components/menu_planner/MenuPreferencesModal.jsx';
import WeeklyMenuView from '@/components/menu_planner/WeeklyMenuView.jsx';
import { useMenuGeneration } from '@/hooks/useMenuGeneration.js';
import { useLinkedUsers } from '@/hooks/useLinkedUsers.js';
import { initialWeeklyMenuState } from '@/lib/menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';

function MenuPlanner({
  recipes = [],
  weeklyMenu: propWeeklyMenu,
  setWeeklyMenu,
  userProfile,
}) {
  const [internalWeeklyMenu, setInternalWeeklyMenu] = useState(
    Array.isArray(propWeeklyMenu) && propWeeklyMenu.length === 7
      ? propWeeklyMenu
      : initialWeeklyMenuState()
  );
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  useEffect(() => {
    setInternalWeeklyMenu(
      Array.isArray(propWeeklyMenu) && propWeeklyMenu.length === 7
        ? propWeeklyMenu
        : initialWeeklyMenuState()
    );
  }, [propWeeklyMenu]);

  const handleSetWeeklyMenu = (newMenu) => {
    const validatedMenu =
      Array.isArray(newMenu) && newMenu.length === 7
        ? newMenu.map((day) =>
            Array.isArray(day)
              ? day.map((meal) => (Array.isArray(meal) ? meal : []))
              : []
          )
        : initialWeeklyMenuState();
    setInternalWeeklyMenu(validatedMenu);
    setWeeklyMenu(validatedMenu);
  };

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('menuPreferences');
    const defaultPreferences = {
      meals: [
        { id: 1, types: ['petit-dejeuner'], enabled: true, mealNumber: 1 },
        { id: 2, types: ['plat'], enabled: true, mealNumber: 2 },
        {
          id: 3,
          types: ['encas-sucre', 'encas-sale'],
          enabled: true,
          mealNumber: 3,
        },
      ],
      maxCalories: 2200,
      weeklyBudget: 35,
      tagPreferences: [],
      servingsPerMeal: 4,
      commonMenuSettings: {
        enabled: false,
        linkedUsers: [],
        linkedUserRecipes: [],
      },
    };

    let initialPrefs = saved ? JSON.parse(saved) : defaultPreferences;
    if (initialPrefs && 'tolerance' in initialPrefs) delete initialPrefs.tolerance;
    if (userProfile?.preferences) {
      initialPrefs = {
        ...initialPrefs,
        servingsPerMeal:
          userProfile.preferences.servingsPerMeal ||
          initialPrefs.servingsPerMeal ||
          4,
        maxCalories:
          userProfile.preferences.maxCalories ||
          initialPrefs.maxCalories ||
          2200,
        weeklyBudget:
          userProfile.preferences.weeklyBudget ||
          initialPrefs.weeklyBudget ||
          35,
        meals: userProfile.preferences.meals?.length
          ? userProfile.preferences.meals
          : initialPrefs.meals,
        tagPreferences: userProfile.preferences.tagPreferences?.length
          ? userProfile.preferences.tagPreferences
          : initialPrefs.tagPreferences,
        commonMenuSettings: {
          ...defaultPreferences.commonMenuSettings,
          ...(userProfile.preferences.commonMenuSettings || {}),
          linkedUsers:
            userProfile.preferences.commonMenuSettings?.linkedUsers || [],
          linkedUserRecipes: [],
        },
      };
    }
    return initialPrefs;
  });

  useEffect(() => {
    localStorage.setItem('menuPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const safeRecipes = useMemo(
    () => (Array.isArray(recipes) ? recipes : []),
    [recipes]
  );

  const availableTags = useMemo(
    () => [
      ...new Set(
        safeRecipes.flatMap((recipe) =>
          Array.isArray(recipe.tags) ? recipe.tags : []
        )
      ),
    ],
    [safeRecipes]
  );

  const { generateMenu, isGenerating } = useMenuGeneration(
    safeRecipes,
    preferences,
    handleSetWeeklyMenu,
    userProfile
  );

  const linkedUserProps = useLinkedUsers(
    userProfile,
    preferences,
    setPreferences
  );

  const handleGenerateMenu = useCallback(() => {
    generateMenu();
  }, [generateMenu]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
        <h2 className="text-2xl sm:text-3xl font-bold text-pastel-primary">
          Menu de la semaine
        </h2>
        <div className="flex flex-wrap gap-3">
          <MenuPreferencesModal
            isOpen={isPreferencesModalOpen}
            onOpenChange={setIsPreferencesModalOpen}
            preferences={preferences}
            setPreferences={setPreferences}
            availableTags={availableTags}
            linkedUserProps={linkedUserProps}
          />
          <Button
            onClick={handleGenerateMenu}
            disabled={isGenerating}
            variant="secondary"
            className="min-w-[200px]"
          >
            <RotateCw
              className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
            />
            {isGenerating
              ? 'Génération en cours...'
              : 'Générer un nouveau menu'}
          </Button>
        </div>
      </div>

      <WeeklyMenuView
        weeklyMenu={internalWeeklyMenu}
        setWeeklyMenu={handleSetWeeklyMenu}
        safeRecipes={safeRecipes}
        preferences={preferences}
        userProfile={userProfile}
      />
    </div>
  );
}

export default MenuPlanner;
