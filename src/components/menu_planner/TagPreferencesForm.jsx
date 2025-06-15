import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

function TagPreferencesForm({ preferences, setPreferences, availableTags }) {
  const addTagPreference = () => {
    if (availableTags?.length > 0) {
      setPreferences({
        ...preferences,
        tagPreferences: [
          ...(preferences.tagPreferences || []),
          { tag: availableTags[0], percentage: 50 },
        ],
      });
    }
  };

  const removeTagPreference = (index) => {
    const newPreferences = [...(preferences.tagPreferences || [])];
    newPreferences.splice(index, 1);
    setPreferences({ ...preferences, tagPreferences: newPreferences });
  };

  const updateTagPreference = (index, field, value) => {
    const newPreferences = [...(preferences.tagPreferences || [])];
    newPreferences[index] = { ...newPreferences[index], [field]: value };
    setPreferences({ ...preferences, tagPreferences: newPreferences });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-pastel-border/70">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Préférences de tags hebdomadaires</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTagPreference}
          disabled={!availableTags?.length}
          className="shadow-pastel-button hover:shadow-pastel-button-hover"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Ajouter un tag
        </Button>
      </div>

      {(preferences.tagPreferences || []).map((pref, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-3 items-center bg-pastel-card-alt p-3 rounded-lg shadow-pastel-card-item"
        >
          <select
            className="flex-grow h-10 rounded-md bg-pastel-input px-3 text-sm text-pastel-text ring-offset-pastel-background placeholder:text-pastel-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-ring focus-visible:border-pastel-input-focus-border shadow-pastel-input hover:border-pastel-muted-foreground/30 focus-visible:shadow-pastel-input-focus w-full sm:w-auto"
            value={pref.tag}
            onChange={(e) => updateTagPreference(index, 'tag', e.target.value)}
          >
            {(availableTags || []).map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="number"
              className="w-24"
              value={pref.percentage}
              onChange={(e) =>
                updateTagPreference(
                  index,
                  'percentage',
                  Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
              min="0"
              max="100"
            />
            <span className="text-sm text-pastel-text/80">%</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeTagPreference(index)}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export default TagPreferencesForm;
