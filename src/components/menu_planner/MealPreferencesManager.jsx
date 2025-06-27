import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import MealTypeSelector from '@/components/MealTypeSelector.jsx';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

function MealPreferencesManager({ meals = [], onChange }) {
  const updateMeal = (index, changes) => {
    const updated = meals.map((m, i) =>
      i === index ? { ...m, ...changes } : { ...m }
    );
    onChange(updated);
  };

  const toggleType = (index, type) => {
    const meal = meals[index];
    if (!meal) return;
    const types = Array.isArray(meal.types) ? [...meal.types] : [];
    const idx = types.indexOf(type);
    if (idx > -1) {
      types.splice(idx, 1);
    } else {
      types.push(type);
    }
    updateMeal(index, { types });
  };

  const moveMeal = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= meals.length) return;
    const arr = [...meals];
    const [moved] = arr.splice(index, 1);
    arr.splice(newIndex, 0, moved);
    onChange(arr.map((m, i) => ({ ...m, mealNumber: i + 1 })));
  };

  const removeMeal = (index) => {
    const arr = meals.filter((_, i) => i !== index);
    onChange(arr.map((m, i) => ({ ...m, mealNumber: i + 1 })));
  };

  const addMeal = () => {
    const newMeal = {
      id: Date.now(),
      mealNumber: meals.length + 1,
      title: `Repas ${meals.length + 1}`,
      types: [],
      enabled: true,
    };
    onChange([...meals, newMeal]);
  };

  return (
    <div className="space-y-4">
      {meals.map((meal, idx) => (
        <div
          key={meal.id || idx}
          className="p-3 rounded-lg bg-pastel-card-alt space-y-2 shadow-pastel-card-item"
        >
          <div className="flex items-center gap-2">
            <Input
              value={meal.title || `Repas ${idx + 1}`}
              onChange={(e) => updateMeal(idx, { title: e.target.value })}
              className="flex-grow h-8"
            />
            <Switch
              checked={meal.enabled ?? true}
              onCheckedChange={(val) => updateMeal(idx, { enabled: val })}
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={idx === 0}
              onClick={() => moveMeal(idx, -1)}
              className="h-7 w-7"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={idx === meals.length - 1}
              onClick={() => moveMeal(idx, 1)}
              className="h-7 w-7"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMeal(idx)}
              className="h-7 w-7 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <MealTypeSelector
            selectedTypes={meal.types || []}
            onToggle={(type) => toggleType(idx, type)}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMeal}
        className="mt-2"
      >
        <Plus className="w-4 h-4 mr-2" /> Ajouter un repas
      </Button>
    </div>
  );
}

export default MealPreferencesManager;
