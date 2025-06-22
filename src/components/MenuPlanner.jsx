import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { RotateCw } from 'lucide-react';
import MenuPreferencesModal from '@/components/menu_planner/MenuPreferencesModal.jsx';
import WeeklyMenuView from '@/components/menu_planner/WeeklyMenuView.jsx';
import { useMenuGeneration } from '@/hooks/useMenuGeneration.js';
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
    };

    const profilePrefs = userProfile?.preferences || {};

    let initialPrefs = {
      ...defaultPreferences,
      ...profilePrefs,
    };

    if (saved) {
      try {
        const savedPrefs = JSON.parse(saved);
        initialPrefs = {
          ...initialPrefs,
          ...savedPrefs,
        };
      } catch (e) {
        console.error('Error parsing saved menu preferences', e);
      }
    }

    if (initialPrefs.tolerance !== undefined) {
      delete initialPrefs.tolerance;
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
