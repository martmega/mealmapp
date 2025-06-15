import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function RecipeCoreFields({
  formData,
  handleInputChange,
  descriptionRef,
  handleDescriptionChange,
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

      <div className="space-y-2">
        <Label htmlFor="description" className="text-pastel-text/90">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          ref={descriptionRef}
          defaultValue={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Une brève description de votre plat..."
          rows={3}
          className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
