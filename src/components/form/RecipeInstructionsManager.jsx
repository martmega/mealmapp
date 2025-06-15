
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecipeInstructionsManager({ instructions, handleInstructionsChange }) {
  return (
    <div className="space-y-2 section-card p-5">
      <Label htmlFor="instructions" className="text-lg font-semibold text-pastel-secondary">Instructions</Label>
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
