import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Loader2, Star } from 'lucide-react';

const RecipeFormAIFeatures = ({
  subscription_tier,
  generateWithAI,
  isGeneratingDescription,
  session,
  formData,
  handleDescriptionChange,
  descriptionRef,
  iaUsage,
}) => {
  console.log('RecipeFormAIFeatures subscription tier:', subscription_tier);
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1.5 gap-2">
        <Label
          htmlFor="description-ai-features"
          className="text-sm font-medium text-pastel-text/90"
        >
          Description (optionnel)
        </Label>
        <Button
          type="button"
          variant={subscription_tier === 'premium' ? 'premium' : 'tertiary'}
          size="sm"
          onClick={() => generateWithAI('description')}
          disabled={
            isGeneratingDescription ||
            !session ||
            (subscription_tier === 'vip' &&
              (iaUsage?.text_requests ?? 0) >= 20 &&
              (iaUsage?.text_credits ?? 0) <= 0)
          }
          className="w-full sm:w-auto"
        >
          {isGeneratingDescription ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : subscription_tier !== 'premium' ? (
            <Star className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
          ) : (
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          )}
          {isGeneratingDescription
            ? 'Génération...'
            : subscription_tier === 'premium'
              ? 'IA Description'
              : 'Premium Description'}
        </Button>
      </div>
      {subscription_tier === 'vip' && (
        <p className="text-xs text-pastel-muted-foreground text-right">
          Descriptions IA : {iaUsage?.text_requests ?? 0} / 20 (crédits :{' '}
          {iaUsage?.text_credits ?? 0})
        </p>
      )}
      <Textarea
        id="description-ai-features"
        ref={descriptionRef}
        name="description"
        value={formData.description}
        onChange={handleDescriptionChange}
        className="min-h-[100px] bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
        placeholder="Décrivez votre recette ici..."
      />
    </div>
  );
};

export default RecipeFormAIFeatures;
