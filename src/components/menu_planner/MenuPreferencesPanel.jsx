import React from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import MealPreferencesForm from '@/components/menu_planner/MealPreferencesForm.jsx';
import TagPreferencesForm from '@/components/menu_planner/TagPreferencesForm.jsx';

function MenuPreferencesPanel({ preferences, setPreferences, availableTags }) {
  const update = (field, value) => {
    setPreferences({ ...preferences, [field]: value });
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
        <Label htmlFor="calories">Calories max par jour</Label>
        <Input
          id="calories"
          type="number"
          value={preferences.daily_calories_limit ?? 2200}
          onChange={(e) => update('daily_calories_limit', parseInt(e.target.value) || 0)}
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
      <MealPreferencesForm preferences={preferences} setPreferences={setPreferences} />
      <TagPreferencesForm
        preferences={preferences}
        setPreferences={setPreferences}
        availableTags={availableTags}
      />
    </div>
  );
}

export default MenuPreferencesPanel;
