import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function RecipeInstructionsManager({
  instructions,
  handleInstructionsChange,
  handleImproveInstructions,
  isImproving,
  iaUsage,
}) {
  const rawText = Array.isArray(instructions)
    ? instructions.join('\n')
    : instructions || '';
  const disabled =
    isImproving ||
    rawText.length < 10 ||
    (iaUsage && (iaUsage.text_credits ?? 0) <= 0);
  return (
    <div className="space-y-2 bg-pastel-card p-5 rounded-xl shadow-pastel-soft">
      <Label
        htmlFor="instructions"
        className="text-lg font-semibold text-pastel-secondary"
      >
        Instructions
      </Label>
      <Textarea
        id="instructions"
        value={rawText}
        onChange={handleInstructionsChange}
        placeholder="Listez les étapes de préparation, une par ligne."
        rows={6}
        className="bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
      />
      <div className="flex justify-between items-center">
        {(iaUsage?.text_credits ?? 0) >= 0 && (
          <p className="text-xs text-pastel-muted-foreground">
            Crédits restants : {iaUsage?.text_credits ?? 0}
          </p>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleImproveInstructions}
          disabled={disabled}
          className="ml-auto"
        >
          {isImproving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Amélioration…
            </>
          ) : (
            'Améliorer les instructions'
          )}
        </Button>
      </div>
    </div>
  );
}
