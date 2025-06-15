import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Tag } from 'lucide-react';

export default function RecipeMetaFields({
  formData,
  MEAL_TYPE_OPTIONS_DATA,
  handleMealTypeToggle,
  showTagManager,
  setShowTagManager,
  handleAddTag,
  handleRemoveTag,
  suggestedTags,
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-pastel-text/90">Types de repas</Label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS_DATA.map((type) => {
            const colorMap = {
              'petit-dejeuner': 'bg-[#d9c2e9]',
              plat: 'bg-[#e8b0a0]',
              'encas-sucre': 'bg-[#f0c4cf]',
            };
            const active = formData.meal_types.includes(type.id);
            return (
              <Button
                key={type.id}
                type="button"
                onClick={() => handleMealTypeToggle(type.id)}
                size="sm"
                className={`font-semibold text-pastel-text ${colorMap[type.id] || 'bg-pastel-muted'} ${active ? 'ring-2 ring-pastel-primary' : ''}`}
              >
                {type.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-pastel-text/90">Tags</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTagManager(true)}
            className="text-pastel-accent hover:text-pastel-accent-hover"
          >
            <Settings className="w-4 h-4 mr-1.5" /> Gérer les tags
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 p-3 bg-pastel-input rounded-md border border-pastel-input-border min-h-[40px]">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center bg-pastel-primary/20 text-pastel-primary text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1.5 text-pastel-primary hover:text-red-500"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="text-xs text-pastel-muted-foreground mr-1 self-center">
              Suggestions:
            </span>
            {suggestedTags.slice(0, 5).map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleAddTag(tag)}
                className="text-xs"
              >
                <Tag className="w-3 h-3 mr-1" /> {tag}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
