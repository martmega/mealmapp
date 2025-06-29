import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function RecipeInstructionsManager({
  instructions,
  handleInstructionsChange,
  handleImproveInstructions,
  isImproving,
}) {
  return (
    <div className="space-y-2 bg-pastel-card p-5 rounded-xl shadow-pastel-soft">
      <div className="flex justify-between items-center">
        <Label
          htmlFor="instructions"
          className="text-lg font-semibold text-pastel-secondary"
        >
          Instructions
        </Label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleImproveInstructions}
          disabled={isImproving}
        >
          {isImproving ? 'Amélioration…' : '✨ Améliorer avec l\u2019IA'}
        </Button>
      </div>
      <Textarea
        id="instructions"
        value={Array.isArray(instructions) ? instructions.join('\n') : ''}
        onChange={handleInstructionsChange}
        placeholder="Listez les étapes de préparation, une par ligne."
        rows={6}
        className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
      />
    </div>
  );
}
