import React from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/Checkbox.jsx';

function MenuPreferencesPanel({ preferences, setPreferences, availableTags }) {
  const update = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
  };

  const updateMeal = (index, value) => {
    const arr = [...(preferences.daily_meal_structure || [])];
    arr[index] = value;
    update('daily_meal_structure', arr);
  };

  const addMeal = () => {
    update('daily_meal_structure', [...(preferences.daily_meal_structure || []), '']);
  };

  const removeMeal = (index) => {
    const arr = [...(preferences.daily_meal_structure || [])];
    arr.splice(index, 1);
    update('daily_meal_structure', arr);
  };

  const toggleTag = (tag) => {
    const set = new Set(preferences.tag_preferences || []);
    if (set.has(tag)) set.delete(tag); else set.add(tag);
    update('tag_preferences', Array.from(set));
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center space-x-2">
          <Checkbox
            id="limit-calories"
            checked={preferences.daily_calories_limit > 0}
            onChange={(checked) =>
              update(
                'daily_calories_limit',
                checked
                  ? preferences.daily_calories_limit > 0
                    ? preferences.daily_calories_limit
                    : 2200
                  : 0
              )
            }
          />
          <Label htmlFor="limit-calories">Limiter les calories ?</Label>
        </div>
        <Label htmlFor="calories">Calories max par jour</Label>
        <Input
          id="calories"
          type="number"
          disabled={!(preferences.daily_calories_limit > 0)}
          value={
            preferences.daily_calories_limit > 0
              ? preferences.daily_calories_limit
              : 2200
          }
          onChange={(e) =>
            update('daily_calories_limit', parseInt(e.target.value) || 0)
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Budget hebdo (€)</Label>
        <Input
          id="budget"
          type="number"
          value={preferences.weekly_budget ?? 35}
          onChange={(e) => update('weekly_budget', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-2">
        <Label>Structure des repas quotidiens</Label>
        {(preferences.daily_meal_structure || []).map((m, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              type="text"
              value={m}
              onChange={(e) => updateMeal(idx, e.target.value)}
              className="flex-grow"
            />
            <Button type="button" variant="ghost" onClick={() => removeMeal(idx)}>
              X
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addMeal}>
          Ajouter un élément
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Tags préférés</Label>
        <div className="flex flex-wrap gap-2">
          {(availableTags || []).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant={preferences.tag_preferences?.includes(tag) ? 'secondary' : 'outline'}
              onClick={() => toggleTag(tag)}
              className="px-2 py-1 text-sm"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuPreferencesPanel;
