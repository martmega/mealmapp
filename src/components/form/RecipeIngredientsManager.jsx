import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { getSuggestedUnits } from '@/lib/units';

export default function RecipeIngredientsManager({
  ingredients,
  handleIngredientChange,
  addIngredient,
  removeIngredient,
}) {
  const onIngredientNameChange = (index, value) => {
    const newIngredients = [...ingredients];
    const suggestedUnits = getSuggestedUnits(value.toLowerCase());
    newIngredients[index] = {
      ...newIngredients[index],
      name: value,
      suggestedUnits: suggestedUnits,
    };
    handleIngredientChange(index, 'name', value);
    if (suggestedUnits.length > 0 && !newIngredients[index].unit) {
      handleIngredientChange(index, 'unit', suggestedUnits[0]);
    }
  };

  return (
    <div className="space-y-4 bg-pastel-card p-5 rounded-xl shadow-pastel-soft">
      <Label className="text-lg font-semibold text-pastel-secondary">
        Ingrédients
      </Label>
      {ingredients.map((ing, index) => (
        <div
          key={index}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end p-3 bg-pastel-card-alt rounded-md"
        >
          <div className="space-y-1">
            <Label
              htmlFor={`ingredient-name-${index}`}
              className="text-xs text-pastel-muted-foreground"
            >
              Nom
            </Label>
            <Input
              id={`ingredient-name-${index}`}
              value={ing.name}
              onChange={(e) => onIngredientNameChange(index, e.target.value)}
              placeholder="Ex: Farine"
              className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`ingredient-quantity-${index}`}
              className="text-xs text-pastel-muted-foreground"
            >
              Quantité
            </Label>
            <Input
              id={`ingredient-quantity-${index}`}
              type="number"
              value={ing.quantity}
              onChange={(e) =>
                handleIngredientChange(index, 'quantity', e.target.value)
              }
              placeholder="Ex: 100"
              className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border w-full sm:w-24"
              min="0"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`ingredient-unit-${index}`}
              className="text-xs text-pastel-muted-foreground"
            >
              Unité
            </Label>
            <Input
              id={`ingredient-unit-${index}`}
              value={ing.unit}
              onChange={(e) =>
                handleIngredientChange(index, 'unit', e.target.value)
              }
              placeholder="Ex: g"
              list={`units-${index}`}
              className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border w-full sm:w-24"
            />
            {ing.suggestedUnits && ing.suggestedUnits.length > 0 && (
              <datalist id={`units-${index}`}>
                {ing.suggestedUnits.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeIngredient(index)}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-9 w-9 self-end"
            title="Supprimer l'ingrédient"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addIngredient}
        className="w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" /> Ajouter un ingrédient
      </Button>
    </div>
  );
}
