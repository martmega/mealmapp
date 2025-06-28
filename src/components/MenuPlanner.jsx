import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { RotateCw, Pencil } from 'lucide-react';
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
  menuName,
  onUpdateMenuName,
  onDeleteMenu,
  preferences,
  updatePreferences,
}) {
  const [internalWeeklyMenu, setInternalWeeklyMenu] = useState(
    Array.isArray(propWeeklyMenu) && propWeeklyMenu.length === 7
      ? propWeeklyMenu
      : initialWeeklyMenuState()
  );
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(menuName || '');

  useEffect(() => {
    setTempName(menuName || '');
  }, [menuName]);

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

  const [internalPreferences, setInternalPreferences] = useState(
    preferences || {
      servingsPerMeal: 4,
      maxCalories: 2200,
      weeklyBudget: 35,
      meals: [],
      tagPreferences: [],
    }
  );

  useEffect(() => {
    setInternalPreferences(
      preferences || {
        servingsPerMeal: 4,
        maxCalories: 2200,
        weeklyBudget: 35,
        meals: [],
        tagPreferences: [],
      }
    );
  }, [preferences]);

  const handleSetPreferences = (newPrefs) => {
    const computed =
      typeof newPrefs === 'function'
        ? newPrefs(internalPreferences)
        : newPrefs;
    setInternalPreferences(computed);
    updatePreferences?.(computed);
  };

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
    internalPreferences,
    handleSetWeeklyMenu,
    userProfile
  );

  const handleGenerateMenu = useCallback(() => {
    generateMenu();
  }, [generateMenu]);

  const submitNameChange = async () => {
    if (!tempName.trim()) {
      setTempName(menuName || '');
      setIsEditingName(false);
      return;
    }
    const success = await onUpdateMenuName?.(tempName.trim());
    if (success !== false) {
      setIsEditingName(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!onDeleteMenu) return;
    const confirmed = window.confirm(
      'Es-tu sûr de vouloir supprimer ce menu ?'
    );
    if (!confirmed) return;
    await onDeleteMenu();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
        <h2 className="group text-2xl sm:text-3xl font-bold text-pastel-primary flex items-center gap-2">
          {isEditingName ? (
            <input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={submitNameChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNameChange();
                if (e.key === 'Escape') {
                  setTempName(menuName || '');
                  setIsEditingName(false);
                }
              }}
              className="bg-transparent border-b border-pastel-border focus:outline-none text-2xl sm:text-3xl font-bold"
            />
          ) : (
            <>
              <span>{menuName || 'Menu de la semaine'}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="ml-1 opacity-0 group-hover:opacity-100 text-pastel-muted-foreground hover:text-pastel-primary"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </h2>
        <div className="flex flex-wrap gap-3">
          <MenuPreferencesModal
            isOpen={isPreferencesModalOpen}
            onOpenChange={setIsPreferencesModalOpen}
            preferences={internalPreferences}
            setPreferences={handleSetPreferences}
            availableTags={availableTags}
            userProfile={userProfile}
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
        preferences={internalPreferences}
        userProfile={userProfile}
      />
    </div>
  );
}

export default MenuPlanner;
