import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  UploadCloud,
  Image as ImageIconLucide,
  Star,
} from 'lucide-react';

const RecipeFormImageHandler = ({
  fileInputRef,
  handleFileChange,
  isUploadingImage,
  session,
  selectedFile,
  previewImage,
  formDataName,
  subscription_tier,
  generateWithAI,
  isGeneratingImage,
  iaUsage,
}) => {
  const { toast } = useToast();
  console.log('RecipeFormImageHandler subscription tier:', subscription_tier);

  const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_IMAGE_CREDIT;

  const handlePurchase = async () => {
    try {
      const res = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICE_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const { url } = data;
      window.location.href = url;
    } catch (err) {
      console.error('purchase credits error:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-pastel-text/90">
        Image de la recette
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage || !session}
          className="h-auto py-3"
        >
          {isUploadingImage ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4 mr-2" />
          )}
          {isUploadingImage
            ? 'Téléversement...'
            : selectedFile
              ? "Changer l'image"
              : 'Téléverser une image'}
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <Button
          type="button"
          variant={subscription_tier === 'premium' ? 'premium' : 'accent'}
          onClick={() => {
            if (subscription_tier === 'vip' && (iaUsage?.image_credits ?? 0) <= 0) {
              handlePurchase();
            } else {
              generateWithAI('image');
            }
          }}
          disabled={isGeneratingImage || !session}
          className="h-auto py-3"
        >
          {isGeneratingImage ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : subscription_tier !== 'premium' ? (
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
          ) : (
            <ImageIconLucide className="w-4 h-4 mr-2" />
          )}
          {isGeneratingImage
            ? 'Génération...'
            : subscription_tier === 'vip' && (iaUsage?.image_credits ?? 0) <= 0
              ? 'Obtenir des crédits'
              : subscription_tier === 'premium'
                ? 'IA Image'
                : 'Premium Image'}
        </Button>
      </div>
      {subscription_tier === 'vip' && (
        <p className="text-xs text-pastel-muted-foreground text-right">
          Crédits restants : {iaUsage?.image_credits ?? 0}
        </p>
      )}
      {previewImage && (
        <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-pastel-border bg-pastel-card-alt shadow-pastel-card-item">
          <img
            className="w-full h-full object-cover"
            alt={`Aperçu de ${formDataName || 'la recette'}`}
            src={previewImage}
          />
        </div>
      )}
    </div>
  );
};

export default RecipeFormImageHandler;
