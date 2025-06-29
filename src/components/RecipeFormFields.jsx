import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Trash2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RecipeFormFields = ({
  formData,
  handleInputChange,
  handleIngredientChange,
  addIngredient,
  removeIngredient,
  handleInstructionsChange,
  MEAL_TYPE_OPTIONS_DATA,
  handleMealTypeToggle,
  setShowTagManager,
  handleAddTag,
  handleRemoveTag,
  suggestedTags,
  descriptionRef,
  handleDescriptionChange,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-sm font-medium text-pastel-text/90"
        >
          Nom de la recette
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="servings"
            className="text-sm font-medium text-pastel-text/90"
          >
            Nombre de portions (base)
          </Label>
          <Input
            id="servings"
            type="number"
            name="servings"
            value={formData.servings}
            onChange={handleInputChange}
            min="1"
            placeholder="Ex: 2"
            required
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="calories"
            className="text-sm font-medium text-pastel-text/90"
          >
            Calories (par portion de base)
          </Label>
          <Input
            id="calories"
            type="number"
            name="calories"
            value={formData.calories}
            onChange={handleInputChange}
            min="0"
            placeholder="Ex: 350"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-pastel-text/90">
          Ingrédients
        </Label>
        {formData.ingredients.map((ingredient, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="flex flex-col sm:flex-row items-stretch gap-2 p-3 bg-pastel-card-alt rounded-lg shadow-pastel-card-item"
          >
            <Input
              type="text"
              value={ingredient.name}
              onChange={(e) =>
                handleIngredientChange(index, 'name', e.target.value)
              }
              placeholder="Ingrédient"
              className="flex-grow"
            />
            <Input
              type="text"
              inputMode="decimal"
              value={ingredient.quantity}
              onChange={(e) => {
                const value = e.target.value.replace(',', '.');
                if (value === '' || /^\d*(\.\d*)?$/.test(value)) {
                  handleIngredientChange(index, 'quantity', value);
                }
              }}
              placeholder="Qté"
              className="w-full sm:w-20"
            />
            <div className="relative w-full sm:w-28">
              <Input
                type="text"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(index, 'unit', e.target.value)
                }
                placeholder="Unité"
                list={`units-${index}`}
                className="w-full"
              />
              {ingredient.suggestedUnits &&
                ingredient.suggestedUnits.length > 0 && (
                  <datalist id={`units-${index}`}>
                    {ingredient.suggestedUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </datalist>
                )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIngredient(index)}
              className="text-red-500/80 hover:bg-red-500/10 hover:text-red-600 self-center sm:self-auto h-10 w-10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addIngredient}
          className="w-full mt-1 border-dashed border-pastel-primary/50 text-pastel-primary hover:bg-pastel-primary/5 hover:border-pastel-primary/80 shadow-pastel-button hover:shadow-pastel-button-hover"
        >
          <Plus className="h-4 w-4 mr-2" /> Ajouter un ingrédient
        </Button>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="instructions"
          className="text-sm font-medium text-pastel-text/90"
        >
          Instructions
        </Label>
        <Textarea
          id="instructions"
          name="instructions"
          value={formData.instructions
            .map((item) => (item.text ? item.text : String(item)))
            .join('\n')}
          onChange={handleInstructionsChange}
          required
          className="min-h-[120px]"
          placeholder="Une étape par ligne..."
        />
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium text-pastel-text/90">
          Type de repas
        </Label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS_DATA.map((type) => {
            const isActive = (formData.meal_types || []).includes(type.id);
            return (
              <Button
                key={type.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMealTypeToggle(type.id)}
                className="rounded-full px-3.5 py-1.5 text-xs sm:text-sm"
              >
                {type.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-pastel-text/90">
            Tags
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTagManager(true)}
            className="text-pastel-text/80 hover:text-pastel-primary shadow-pastel-button hover:shadow-pastel-button-hover"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Gérer
          </Button>
        </div>
        <div className="p-3 bg-pastel-card-alt rounded-lg shadow-pastel-card-item">
          <div className="flex flex-wrap gap-2 min-h-[38px] items-center">
            {formData.tags.map((tag) => (
              <motion.div
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center bg-pastel-accent/80 text-pastel-accent-text rounded-full px-3 py-1 text-sm font-medium shadow-pastel-button"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 text-pastel-accent-text/80 hover:text-pastel-accent-text"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
          {suggestedTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-pastel-border/50">
              <Label className="block text-xs font-medium text-pastel-muted-foreground mb-1">
                Suggestions
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto rounded-full px-2 py-1 text-xs font-medium"
                    onClick={() => handleAddTag(tag)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Input
          type="text"
          placeholder="Ajouter un tag personnalisé et appuyer sur Entrée"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="description-ai-fields"
          className="text-sm font-medium text-pastel-text/90"
        >
          Description (optionnel)
        </Label>
        <Textarea
          id="description-ai-fields"
          ref={descriptionRef}
          name="description"
          value={formData.description}
          onChange={handleDescriptionChange}
          className="min-h-[100px]"
          placeholder="Décrivez votre recette ici..."
        />
      </div>
    </>
  );
};

export default RecipeFormFields;
