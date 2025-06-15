import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  Link,
  Unlink,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import MealTypeSelector from '@/components/MealTypeSelector';
import TagPreferencesForm from '@/components/menu_planner/TagPreferencesForm.jsx';
import CommonMenuSettings from '@/components/menu_planner/CommonMenuSettings.jsx';

function MenuPreferencesPanel({
  preferences,
  setPreferences,
  availableTags,
  newLinkedUserEmail,
  setNewLinkedUserEmail,
  isLinkingUser,
  handleAddLinkedUser,
  handleToggleCommonMenu,
  handleLinkedUserRatioChange,
  handleRemoveLinkedUser,
}) {
  const addMeal = () => {
    const newMealNumber = (preferences.meals?.length || 0) + 1;
    setPreferences({
      ...preferences,
      meals: [
        ...(preferences.meals || []),
        {
          id: Date.now(),
          types: [],
          enabled: true,
          mealNumber: newMealNumber,
        },
      ],
    });
  };

  const removeMeal = (index) => {
    const newMeals = [...(preferences.meals || [])];
    newMeals.splice(index, 1);
    const renumberedMeals = newMeals.map((meal, idx) => ({
      ...meal,
      mealNumber: idx + 1,
    }));
    setPreferences({ ...preferences, meals: renumberedMeals });
  };

  const toggleMealType = (mealIndex, type) => {
    const newMeals = [...(preferences.meals || [])];
    const currentTypes = newMeals[mealIndex].types || [];
    const typeIndex = currentTypes.indexOf(type);

    if (typeIndex === -1) {
      newMeals[mealIndex].types = [...currentTypes, type];
    } else {
      newMeals[mealIndex].types = currentTypes.filter((t) => t !== type);
    }

    setPreferences({ ...preferences, meals: newMeals });
  };

  const moveMeal = (index, direction) => {
    const newMeals = [...(preferences.meals || [])];
    let targetIndex;
    if (direction === 'up' && index > 0) {
      targetIndex = index - 1;
    } else if (direction === 'down' && index < newMeals.length - 1) {
      targetIndex = index + 1;
    } else {
      return;
    }
    [newMeals[index], newMeals[targetIndex]] = [
      newMeals[targetIndex],
      newMeals[index],
    ];
    const renumberedMeals = newMeals.map((meal, idx) => ({
      ...meal,
      mealNumber: idx + 1,
    }));
    setPreferences({ ...preferences, meals: renumberedMeals });
  };


  const handleServingsPerMealChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPreferences({ ...preferences, servingsPerMeal: value > 0 ? value : 1 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft mb-8 space-y-6 overflow-hidden"
    >
      <h3 className="text-xl font-semibold text-pastel-primary">
        Préférences du menu
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="servingsPerMeal"
            className="block text-base font-medium mb-1.5 flex items-center"
          >
            <Users className="w-4 h-4 mr-2 text-pastel-secondary" /> Portions
            par repas (défaut)
          </Label>
          <Input
            id="servingsPerMeal"
            type="number"
            value={preferences.servingsPerMeal || 4}
            onChange={handleServingsPerMealChange}
            min="1"
            step="1"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="maxCalories"
            className="block text-base font-medium mb-1.5"
          >
            Calories max. par jour
          </Label>
          <Input
            id="maxCalories"
            type="number"
            value={preferences.maxCalories || 2200}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                maxCalories: parseInt(e.target.value) || 0,
              })
            }
            min="500"
            step="50"
            className="max-w-xs"
          />
        </div>
      </div>

        <CommonMenuSettings
          preferences={preferences}
          newLinkedUserEmail={newLinkedUserEmail}
          setNewLinkedUserEmail={setNewLinkedUserEmail}
          isLinkingUser={isLinkingUser}
          handleAddLinkedUser={handleAddLinkedUser}
          handleToggleCommonMenu={handleToggleCommonMenu}
          handleLinkedUserRatioChange={handleLinkedUserRatioChange}
          handleRemoveLinkedUser={handleRemoveLinkedUser}
        />

      <div className="space-y-4 pt-4 border-t border-pastel-border/70">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">
            Composition des repas quotidiens
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMeal}
            className="shadow-pastel-button hover:shadow-pastel-button-hover"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un repas
          </Button>
        </div>

        {(preferences.meals || []).map((meal, index) => (
          <motion.div
            key={meal.id || index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 bg-pastel-card-alt p-4 rounded-lg shadow-pastel-card-item"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveMeal(index, 'up')}
                    disabled={index === 0}
                    className="h-7 w-7"
                  >
                    {' '}
                    <ChevronUp className="w-4 h-4" />{' '}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveMeal(index, 'down')}
                    disabled={index === (preferences.meals || []).length - 1}
                    className="h-7 w-7"
                  >
                    {' '}
                    <ChevronDown className="w-4 h-4" />{' '}
                  </Button>
                </div>
                <Label className="font-medium text-pastel-text/90">
                  Repas {meal.mealNumber}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={meal.enabled ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newMeals = [...(preferences.meals || [])];
                    newMeals[index] = {
                      ...newMeals[index],
                      enabled: !meal.enabled,
                    };
                    setPreferences({ ...preferences, meals: newMeals });
                  }}
                  className="min-w-[90px]"
                >
                  {meal.enabled ? 'Activé' : 'Désactivé'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMeal(index)}
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
                >
                  {' '}
                  <Trash2 className="w-4 h-4" />{' '}
                </Button>
              </div>
            </div>

              <div className="pt-2 border-t border-pastel-border/70">
                <MealTypeSelector
                  selectedTypes={meal.types || []}
                  onToggle={(type) => toggleMealType(index, type)}
                />
              </div>
          </motion.div>
        ))}
      </div>

        <TagPreferencesForm
          preferences={preferences}
          setPreferences={setPreferences}
          availableTags={availableTags}
        />
    </motion.div>
  );
}

export default MenuPreferencesPanel;
