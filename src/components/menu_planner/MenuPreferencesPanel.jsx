import React, { useState } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import MealTypeSelector from '@/components/MealTypeSelector.jsx';
import CommonMenuSettings from '@/components/menu_planner/CommonMenuSettings.jsx';
import { useLinkedUsers } from '@/hooks/useLinkedUsers.js';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { MEAL_TYPE_OPTIONS_MAP } from '@/lib/mealTypes';

function MenuPreferencesPanel({
  preferences,
  setPreferences,
  availableTags,
  userProfile,
}) {
  const update = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
  };

  const toggleMeal = (type) => {
    const arr = [...(preferences.daily_meal_structure || [])];
    if (arr.includes(type)) {
      update('daily_meal_structure', arr.filter((t) => t !== type));
    } else {
      update('daily_meal_structure', [...arr, type]);
    }
  };

  const addMeal = () => {
    const newMealNumber = (preferences.meals?.length || 0) + 1;
    update('meals', [
      ...(preferences.meals || []),
      {
        id: Date.now(),
        types: [],
        enabled: true,
        mealNumber: newMealNumber,
      },
    ]);
  };

  const removeMeal = (index) => {
    const arr = [...(preferences.meals || [])];
    arr.splice(index, 1);
    const renum = arr.map((m, idx) => ({ ...m, mealNumber: idx + 1 }));
    update('meals', renum);
  };

  const moveMeal = (index, dir) => {
    const arr = [...(preferences.meals || [])];
    if (dir === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    } else if (dir === 'down' && index < arr.length - 1) {
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    }
    const renum = arr.map((m, idx) => ({ ...m, mealNumber: idx + 1 }));
    update('meals', renum);
  };

  const toggleMealTypeFor = (mealIndex, type) => {
    const arr = [...(preferences.meals || [])];
    const meal = arr[mealIndex];
    if (!meal) return;
    const types = meal.types || [];
    arr[mealIndex] = {
      ...meal,
      types: types.includes(type)
        ? types.filter((t) => t !== type)
        : [...types, type],
    };
    update('meals', arr);
  };

  const toggleMealEnabled = (index) => {
    const arr = [...(preferences.meals || [])];
    if (arr[index]) {
      arr[index] = { ...arr[index], enabled: !arr[index].enabled };
      update('meals', arr);
    }
  };

  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (!preferences.tag_preferences?.includes(tag)) {
      update('tag_preferences', [...(preferences.tag_preferences || []), tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    update(
      'tag_preferences',
      (preferences.tag_preferences || []).filter((t) => t !== tag)
    );
  };

  const {
    newLinkedUserTag,
    setNewLinkedUserTag,
    isLinkingUser,
    handleAddLinkedUser,
    handleToggleCommonMenu,
    handleLinkedUserRatioChange,
    handleRemoveLinkedUser,
  } = useLinkedUsers(userProfile, preferences, setPreferences);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold text-pastel-text">Quantités</h3>
        <div className="space-y-2">
          <Label htmlFor="portions">Portions par repas</Label>
          <Input
            id="portions"
            type="number"
            min="1"
            value={preferences.portions_per_meal ?? 4}
            onChange={(e) => update('portions_per_meal', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calories">Calories max par jour</Label>
          <Input
            id="calories"
            type="number"
            value={preferences.daily_calories_limit ?? 2200}
            onChange={(e) => update('daily_calories_limit', parseInt(e.target.value) || 0)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-pastel-text">Budget</h3>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget hebdo (€)</Label>
          <Input
            id="budget"
            type="number"
            value={preferences.weekly_budget ?? 35}
            onChange={(e) => update('weekly_budget', parseFloat(e.target.value) || 0)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-pastel-text">Structure quotidienne</h3>
        <MealTypeSelector
          selectedTypes={preferences.daily_meal_structure || []}
          onToggle={toggleMeal}
        />
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-pastel-text">Composition des repas quotidiens</h3>
          <Button type="button" variant="outline" size="sm" onClick={addMeal} className="shadow-pastel-button hover:shadow-pastel-button-hover">
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un repas
          </Button>
        </div>

        {(preferences.meals || []).map((meal, index) => (
          <div key={meal.id || index} className="space-y-3 bg-pastel-card-alt p-4 rounded-lg shadow-pastel-card-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveMeal(index, 'up')} disabled={index === 0} className="h-7 w-7">
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveMeal(index, 'down')} disabled={index === (preferences.meals || []).length - 1} className="h-7 w-7">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <Label className="font-medium text-pastel-text/90">Repas {meal.mealNumber}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant={meal.enabled ? 'secondary' : 'outline'} size="sm" onClick={() => toggleMealEnabled(index)} className="min-w-[90px]">
                  {meal.enabled ? 'Activé' : 'Désactivé'}
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMeal(index)} className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-pastel-border/70">
              {Object.entries(MEAL_TYPE_OPTIONS_MAP).map(([typeKey, label]) => {
                const isActive = (meal.types || []).includes(typeKey);
                return (
                  <Button key={typeKey} type="button" size="sm" variant={isActive ? 'default' : 'outline'} onClick={() => toggleMealTypeFor(index, typeKey)} className="rounded-full px-3 py-1 text-xs">
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-pastel-text">Tags préférés</h3>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            list="tag-suggestions"
            placeholder="Ajouter un tag"
            className="flex-grow"
          />
          <datalist id="tag-suggestions">
            {(availableTags || []).map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(preferences.tag_preferences || []).map((tag) => (
            <span
              key={tag}
              className="flex items-center bg-pastel-primary/20 text-pastel-primary text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 text-pastel-primary hover:text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-pastel-text">Participants (si partagé)</h3>
        <CommonMenuSettings
          preferences={preferences}
          newLinkedUserTag={newLinkedUserTag}
          setNewLinkedUserTag={setNewLinkedUserTag}
          isLinkingUser={isLinkingUser}
          handleAddLinkedUser={handleAddLinkedUser}
          handleToggleCommonMenu={handleToggleCommonMenu}
          handleLinkedUserRatioChange={handleLinkedUserRatioChange}
          handleRemoveLinkedUser={handleRemoveLinkedUser}
        />
      </section>
    </div>
  );
}

export default MenuPreferencesPanel;
