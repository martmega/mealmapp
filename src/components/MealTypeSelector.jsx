import React from 'react';
import { Button } from '@/components/ui/button';
import { MEAL_TYPE_OPTIONS_MAP } from '@/lib/mealTypes';

function MealTypeSelector({ selectedTypes = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(MEAL_TYPE_OPTIONS_MAP).map(([typeKey, label]) => {
        const isActive = selectedTypes.includes(typeKey);
        return (
          <Button
            key={typeKey}
            type="button"
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onToggle(typeKey)}
            className="rounded-full px-3 py-1 text-xs"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export default MealTypeSelector;
