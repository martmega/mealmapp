import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function useAIGeneration({
  session,
  userProfile,
  formData,
  setFormData,
  descriptionRef,
  setPreviewImage,
  setSelectedFile,
  toast,
  onClose,
}) {
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const navigate = useNavigate();

  const isPremiumUser = userProfile?.subscription_tier === 'premium';

  const handlePremiumFeatureClick = useCallback(
    (featureName) => {
      toast({
        title: 'Fonctionnalité Premium',
        description: (
          <div className="flex flex-col gap-2">
            <span>{`La génération IA ${featureName} est réservée aux membres Premium.`}</span>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                onClose();
                navigate('/app/account');
              }}
              className="mt-2"
            >
              Passer à Premium
            </Button>
          </div>
        ),
        duration: 8000,
      });
    },
    [navigate, onClose, toast]
  );

  const generateWithAI = useCallback(
    async (type) => {
      if (!session) {
        toast({
          title: 'Connexion requise',
          description: 'Veuillez vous connecter pour utiliser les fonctionnalités IA.',
          variant: 'default',
        });
        return;
      }

      if (!isPremiumUser) {
        handlePremiumFeatureClick(type === 'description' ? 'de description' : "d'images");
        return;
      }

      if (!formData.name || !formData.ingredients.some((i) => i.name)) {
        toast({
          title: 'Information manquante',
          description: 'Veuillez remplir au moins le nom et un ingrédient.',
          variant: 'destructive',
        });
        return;
      }

      if (type === 'description') setIsGeneratingDescription(true);
      if (type === 'image') setIsGeneratingImage(true);

      try {
        const ingredientsList = formData.ingredients
          .filter((i) => i.name)
          .map((i) => `${i.quantity || ''} ${i.unit || ''} ${i.name}`.trim())
          .join(', ');
        const functionName = type === 'description' ? 'generate-recipe' : 'generate-image';
        const promptBase =
          type === 'description'
            ? `Génère une description courte (environ 150 caractères), engageante et appétissante pour une recette nommée "${formData.name}" avec les ingrédients: ${ingredientsList}. Instructions: ${formData.instructions.join(' ')}. Ton: chaleureux et invitant.`
            : `Photographie culinaire professionnelle, très appétissante et réaliste de "${formData.name}", un plat préparé avec: ${ingredientsList}. Style: éclairage naturel vif, couleurs riches, mise au point sélective, arrière-plan subtilement flouté. Composition artistique. Haute résolution.`;

        const response = await fetch(`${supabase.functions.url}/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt: promptBase }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `La génération ${type === 'description' ? 'de la description' : "de l'image"} a échoué.`
          );
        }

        const data = await response.json();

        if (type === 'description') {
          const generatedDescription = data.choices[0].message.content;
          setFormData((prev) => ({ ...prev, description: generatedDescription }));
          if (descriptionRef.current) descriptionRef.current.value = generatedDescription;
          toast({
            title: 'Description générée',
            description: 'La description a été mise à jour.',
          });
        } else if (type === 'image') {
          setFormData((prev) => ({ ...prev, image_url: data.url }));
          setPreviewImage(data.url);
          setSelectedFile(null);
          toast({
            title: 'Image générée',
            description: "L'image a été mise à jour.",
          });
        }
      } catch (error) {
        console.error('Erreur IA:', error);
        toast({
          title: 'Erreur de génération',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        if (type === 'description') setIsGeneratingDescription(false);
        if (type === 'image') setIsGeneratingImage(false);
      }
    },
    [session, isPremiumUser, formData, setFormData, descriptionRef, setPreviewImage, setSelectedFile, toast, handlePremiumFeatureClick]
  );

  return { generateWithAI, isGeneratingDescription, isGeneratingImage, isPremiumUser };
}
