import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import MealTypeSelector from '@/components/MealTypeSelector.jsx';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

function MealPreferencesForm({ preferences, setPreferences }) {
  const meals = Array.isArray(preferences.meals) ? preferences.meals : [];

  const setMeals = (newMeals) => {
    const normalized = newMeals.map((m, idx) => ({ ...m, mealNumber: idx + 1 }));
    setPreferences({ ...preferences, meals: normalized });
  };

  const addMeal = () => {
    const newMealNumber = meals.length + 1;
    setMeals([
      ...meals,
      {
        id: Date.now(),
        title: `Repas ${newMealNumber}`,
        types: [],
        enabled: true,
        mealNumber: newMealNumber,
      },
    ]);
  };

  const removeMeal = (index) => {
    const updated = meals.filter((_, i) => i !== index);
    setMeals(updated);
  };

  const updateMeal = (index, field, value) => {
    const updated = meals.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    setMeals(updated);
  };

  const moveMeal = (from, to) => {
    if (to < 0 || to >= meals.length) return;
    const updated = [...meals];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setMeals(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-pastel-border/70">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Composition quotidienne</Label>
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
      {meals.map((meal, index) => (
        <motion.div
          key={meal.id || index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 bg-pastel-card-alt p-3 rounded-lg shadow-pastel-card-item"
        >
          <div className="flex items-center gap-2">
            <Input
              value={meal.title || ''}
              onChange={(e) => updateMeal(index, 'title', e.target.value)}
              placeholder={`Repas ${index + 1}`}
              className="flex-grow"
            />
            <Switch
              checked={meal.enabled}
              onCheckedChange={(v) => updateMeal(index, 'enabled', v)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveMeal(index, index - 1)}
              disabled={index === 0}
              className="h-8 w-8"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => moveMeal(index, index + 1)}
              disabled={index === meals.length - 1}
              className="h-8 w-8"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMeal(index)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <MealTypeSelector
            selectedTypes={meal.types || []}
            onToggle={(type) => {
              const newTypes = meal.types?.includes(type)
                ? meal.types.filter((t) => t !== type)
                : [...(meal.types || []), type];
              updateMeal(index, 'types', newTypes);
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default MealPreferencesForm;
