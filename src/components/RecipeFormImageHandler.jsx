
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, Image as ImageIconLucide, Star } from "lucide-react";

const RecipeFormImageHandler = ({
  fileInputRef,
  handleFileChange,
  isUploadingImage,
  session,
  selectedFile,
  previewImage,
  formDataName,
  isPremiumUser, 
  generateWithAI, 
  isGeneratingImage 
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-pastel-text/90">Image de la recette</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage || !session} className="h-auto py-3">
          {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2" />}
          {isUploadingImage ? "Téléversement..." : (selectedFile ? "Changer l'image" : "Téléverser une image")}
        </Button>
        <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
        
        <Button 
            type="button" 
            variant={isPremiumUser ? "premium" : "accent"}
            onClick={() => generateWithAI('image')} 
            disabled={isGeneratingImage || !session} 
            className="h-auto py-3"
          >
          {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : (!isPremiumUser ? <Star className="w-4 h-4 mr-2 text-yellow-400" /> : <ImageIconLucide className="w-4 h-4 mr-2" />)}
          {isGeneratingImage ? "Génération..." : (isPremiumUser ? "IA Image" : "Premium Image")}
        </Button>
      </div>
      {previewImage && (
        <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-pastel-border bg-pastel-card-alt shadow-pastel-card-item">
          <img  class="w-full h-full object-cover" alt={`Aperçu de ${formDataName || 'la recette'}`} src={previewImage} />
        </div>
      )}
    </div>
  );
};

export default RecipeFormImageHandler;
