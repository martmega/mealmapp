import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RecipeCoreFields({
  formData,
  handleInputChange,
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-pastel-text/90">
          Nom de la recette
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ex: Tarte aux pommes de Mamie"
          required
          className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="servings" className="text-pastel-text/90">
            Portions
          </Label>
          <Input
            id="servings"
            name="servings"
            type="number"
            value={formData.servings}
            onChange={handleInputChange}
            min="1"
            required
            className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calories" className="text-pastel-text/90">
            Calories (par portion)
          </Label>
          <Input
            id="calories"
            name="calories"
            type="number"
            value={formData.calories}
            onChange={handleInputChange}
            placeholder="Optionnel"
            min="0"
            className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
          />
        </div>
      </div>
    </div>
  );
}
