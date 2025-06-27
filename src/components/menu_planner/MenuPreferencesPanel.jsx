import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/Checkbox.jsx';
import MealTypeSelector from '@/components/MealTypeSelector.jsx';
import CommonMenuSettings from '@/components/menu_planner/CommonMenuSettings.jsx';
import { useLinkedUsers } from '@/hooks/useLinkedUsers.js';

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

  const [tagInput, setTagInput] = useState('');

  const savedLimit = useRef(preferences.daily_calories_limit ?? 2200);
  const [limitCalories, setLimitCalories] = useState(
    preferences.daily_calories_limit !== null &&
      preferences.daily_calories_limit !== undefined
  );

  useEffect(() => {
    if (
      preferences.daily_calories_limit !== null &&
      preferences.daily_calories_limit !== undefined
    ) {
      savedLimit.current = preferences.daily_calories_limit;
      setLimitCalories(true);
    } else {
      setLimitCalories(false);
    }
  }, [preferences.daily_calories_limit]);

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
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={limitCalories}
              onChange={(checked) => {
                setLimitCalories(checked);
                if (!checked) {
                  savedLimit.current = preferences.daily_calories_limit ?? 2200;
                  update('daily_calories_limit', null);
                } else {
                  update('daily_calories_limit', savedLimit.current ?? 2200);
                }
              }}
            />
            <span>Limiter les calories ?</span>
          </label>
          <Input
            id="calories"
            type="number"
            disabled={!limitCalories}
            value={
              limitCalories
                ? preferences.daily_calories_limit ?? 2200
                : savedLimit.current ?? 2200
            }
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              savedLimit.current = val;
              update('daily_calories_limit', val);
            }}
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
