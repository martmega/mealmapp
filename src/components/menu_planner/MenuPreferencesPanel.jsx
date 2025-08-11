import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { motion } from 'framer-motion';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Users,
} from 'lucide-react';
import MealTypeSelector from '@/components/MealTypeSelector.jsx';
import TagPreferencesForm from '@/components/menu_planner/TagPreferencesForm.jsx';
import CommonMenuSettings from '@/components/menu_planner/CommonMenuSettings.jsx';
import { useLinkedUsers } from '@/hooks/useLinkedUsers.js';
import { DEFAULT_MENU_PREFS } from '@/lib/defaultPreferences.js';

function MenuPreferencesPanel({ preferences, setPreferences, availableTags, userProfile, isShared }) {
  const addMeal = () => {
    const newMealNumber = (preferences.meals?.length || 0) + 1;
    setPreferences({
      ...preferences,
      meals: [
        ...(preferences.meals || []),
        { id: Date.now(), types: [], enabled: true, mealNumber: newMealNumber },
      ],
    });
  };

  const removeMeal = (index) => {
    const newMeals = [...(preferences.meals || [])];
    newMeals.splice(index, 1);
    const renumberedMeals = newMeals.map((meal, idx) => ({ ...meal, mealNumber: idx + 1 }));
    setPreferences({ ...preferences, meals: renumberedMeals });
  };

  const toggleMealType = (mealIndex, type) => {
    const newMeals = [...(preferences.meals || [])];
    const current = newMeals[mealIndex].types || [];
    if (current.includes(type)) {
      newMeals[mealIndex].types = current.filter((t) => t !== type);
    } else {
      newMeals[mealIndex].types = [...current, type];
    }
    setPreferences({ ...preferences, meals: newMeals });
  };

  const moveMeal = (index, direction) => {
    const newMeals = [...(preferences.meals || [])];
    let target = null;
    if (direction === 'up' && index > 0) target = index - 1;
    if (direction === 'down' && index < newMeals.length - 1) target = index + 1;
    if (target === null) return;
    [newMeals[index], newMeals[target]] = [newMeals[target], newMeals[index]];
    const renumbered = newMeals.map((m, idx) => ({ ...m, mealNumber: idx + 1 }));
    setPreferences({ ...preferences, meals: renumbered });
  };

  const handleServingsChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setPreferences({ ...preferences, servingsPerMeal: val > 0 ? val : 1 });
  };

  const [tagInput, setTagInput] = useState('');

  const addSimpleTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!(preferences.tagPreferences || []).includes(tag)) {
      setPreferences({
        ...preferences,
        tagPreferences: [...(preferences.tagPreferences || []), tag],
      });
    }
    setTagInput('');
  };

  const removeSimpleTag = (tag) => {
    setPreferences({
      ...preferences,
      tagPreferences: (preferences.tagPreferences || []).filter((t) => t !== tag),
    });
  };

  const {
    newLinkedUserTag,
    setNewLinkedUserTag,
    isLinkingUser,
    handleAddLinkedUser,
    handleLinkedUserWeightChange,
    handleRemoveLinkedUser,
  } = useLinkedUsers(userProfile, preferences, setPreferences, isShared);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft mb-8 space-y-6 overflow-hidden"
    >
      <h3 className="text-xl font-semibold text-pastel-primary">Préférences du menu</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="servingsPerMeal" className="block text-base font-medium mb-1.5 flex items-center">
            <Users className="w-4 h-4 mr-2 text-pastel-secondary" /> Portions par repas (défaut)
          </Label>
          <Input
            id="servingsPerMeal"
            type="number"
            value={
              preferences.servingsPerMeal || DEFAULT_MENU_PREFS.servingsPerMeal
            }
            onChange={handleServingsChange}
            min="1"
            step="1"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxCalories" className="block text-base font-medium mb-1.5">
            Calories max. par jour
          </Label>
          <Input
            id="maxCalories"
            type="number"
            value={preferences.maxCalories || DEFAULT_MENU_PREFS.maxCalories}
            onChange={(e) =>
              setPreferences({ ...preferences, maxCalories: parseInt(e.target.value) || 0 })
            }
            min="500"
            step="50"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeklyBudget" className="block text-base font-medium mb-1.5">
            Budget hebdomadaire (€)
          </Label>
          <Input
            id="weeklyBudget"
            type="number"
            value={preferences.weeklyBudget || DEFAULT_MENU_PREFS.weeklyBudget}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                weeklyBudget: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            step="0.5"
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-pastel-border/70">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Composition des repas quotidiens</Label>
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

        <div className="space-y-4">
          {(preferences.meals || []).map((meal, index) => (
            <motion.div
              key={meal.id || index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 bg-pastel-card p-4 rounded-xl shadow-pastel-soft"
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
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveMeal(index, 'down')}
                      disabled={index === (preferences.meals || []).length - 1}
                      className="h-7 w-7"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <Label className="font-medium text-pastel-text/90">Repas {meal.mealNumber}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={meal.enabled ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newMeals = [...(preferences.meals || [])];
                      newMeals[index] = { ...newMeals[index], enabled: !meal.enabled };
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
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t border-pastel-border/70">
                <MealTypeSelector selectedTypes={meal.types || []} onToggle={(t) => toggleMealType(index, t)} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-pastel-border/70">
        <h4 className="font-medium text-pastel-text">Tags préférés</h4>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSimpleTag();
              }
            }}
            placeholder="Ajouter un tag"
            className="flex-grow"
          />
          <Button type="button" variant="outline" size="sm" onClick={addSimpleTag}>
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(preferences.tagPreferences || []).map((tag) => (
            <span
              key={tag}
              className="flex items-center bg-pastel-primary/20 text-pastel-primary text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeSimpleTag(tag)}
                className="ml-1.5 text-pastel-primary hover:text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      <CommonMenuSettings
        preferences={preferences}
        newLinkedUserTag={newLinkedUserTag}
        setNewLinkedUserTag={setNewLinkedUserTag}
        isLinkingUser={isLinkingUser}
        handleAddLinkedUser={handleAddLinkedUser}
        handleLinkedUserWeightChange={handleLinkedUserWeightChange}
        handleRemoveLinkedUser={handleRemoveLinkedUser}
        isShared={isShared}
      />

      <TagPreferencesForm preferences={preferences} setPreferences={setPreferences} availableTags={availableTags} />
    </motion.div>
  );
}

export default MenuPreferencesPanel;
