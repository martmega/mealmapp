import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Eye, EyeOff, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TagManager from '@/components/TagManager';
import { useToast } from '@/components/ui/use-toast';
import RecipeFormImageHandler from '@/components/RecipeFormImageHandler';
import RecipeFormAIFeatures from '@/components/RecipeFormAIFeatures';
import useTagHandling from '@/components/form/hooks/useTagHandling';
import useImageUpload from '@/components/form/hooks/useImageUpload';
import useAIGeneration from '@/components/form/hooks/useAIGeneration';
import RecipeCoreFields from '@/components/form/RecipeCoreFields';
import RecipeIngredientsManager from '@/components/form/RecipeIngredientsManager';
import RecipeInstructionsManager from '@/components/form/RecipeInstructionsManager';
import RecipeMetaFields from '@/components/form/RecipeMetaFields';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MEAL_TYPE_OPTIONS_DATA = [
  { id: 'petit-dejeuner', label: 'Petit déjeuner' },
  { id: 'entree', label: 'Entrée' },
  { id: 'plat', label: 'Plat principal' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'encas-sucre', label: 'Encas sucré' },
  { id: 'encas-sale', label: 'Encas salé' },
];

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Privée', icon: EyeOff },
  { id: 'friends_only', label: 'Amis Seulement', icon: Users },
  { id: 'public', label: 'Publique', icon: Globe },
];

const initialFormData = {
  name: '',
  description: '',
  servings: 1,
  calories: '',
  ingredients: [{ name: '', quantity: '', unit: '', suggestedUnits: [] }],
  instructions: [],
  tags: [],
  image_url: '',
  meal_types: [],
  visibility: 'private',
};

function RecipeForm({
  recipe = null,
  onSubmit,
  onClose,
  session,
  userProfile,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const descriptionRef = useRef(null);

  const {
    showTagManager,
    setShowTagManager,
    suggestedTags,
    existingTags,
    setExistingTags,
    handleAddTag,
    handleRemoveTag,
  } = useTagHandling(formData, setFormData);

  const {
    fileInputRef,
    handleFileChange,
    uploadImage,
    selectedFile,
    previewImage,
    isUploadingImage,
    setPreviewImage,
    setSelectedFile,
  } = useImageUpload(session, toast, setFormData);

  const {
    generateWithAI,
    isGeneratingDescription,
    isGeneratingImage,
    isPremiumUser,
  } = useAIGeneration({
    session,
    userProfile,
    formData,
    setFormData,
    descriptionRef,
    setPreviewImage,
    setSelectedFile,
    toast,
    onClose,
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        description: recipe.description || '',
        servings: recipe.servings || 1,
        calories: recipe.calories || '',
        ingredients: recipe.ingredients?.map((ing) => ({
          ...ing,
          suggestedUnits: [],
        })) || [{ name: '', quantity: '', unit: '', suggestedUnits: [] }],
        instructions: Array.isArray(recipe.instructions)
          ? recipe.instructions
          : recipe.instructions
            ? [recipe.instructions]
            : [],
        tags: Array.isArray(recipe.tags) ? recipe.tags : [],
        image_url: recipe.image_url || '',
        meal_types: Array.isArray(recipe.meal_types) ? recipe.meal_types : [],
        visibility: recipe.visibility || 'private',
      });
      if (descriptionRef.current && recipe.description) {
        descriptionRef.current.value = recipe.description;
      }
      if (recipe.image_url) {
        setPreviewImage(recipe.image_url);
      } else {
        setPreviewImage(null);
      }
    } else {
      setFormData(initialFormData);
      if (descriptionRef.current) {
        descriptionRef.current.value = '';
      }
      setPreviewImage(null);
    }
    setSelectedFile(null);
  }, [recipe]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'servings') {
      const numValue = parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue > 0 ? numValue : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDescriptionChange = (e) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData((prev) => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name: '', quantity: '', unit: '', suggestedUnits: [] },
      ],
    }));
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleMealTypeToggle = (typeId) => {
    setFormData((prev) => ({
      ...prev,
      meal_types: prev.meal_types.includes(typeId)
        ? prev.meal_types.filter((id) => id !== typeId)
        : [...prev.meal_types, typeId],
    }));
  };


  const handleInstructionsChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      instructions: e.target.value.split('\n'),
    }));
  };

  const handleVisibilityChange = (value) => {
    setFormData((prev) => ({ ...prev, visibility: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      name,
      ingredients,
      instructions,
      meal_types,
      servings,
      visibility,
    } = formData;

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la recette est requis.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    if (!ingredients.some((ing) => ing.name.trim())) {
      toast({
        title: 'Erreur',
        description: 'Au moins un ingrédient est requis.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    if (
      !instructions ||
      instructions.length === 0 ||
      instructions.every((line) => line.trim() === '')
    ) {
      toast({
        title: 'Erreur',
        description: 'Les instructions sont requises.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    if (meal_types.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un type de repas.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(parseInt(servings, 10)) || parseInt(servings, 10) <= 0) {
      toast({
        title: 'Erreur',
        description:
          'Le nombre de portions doit être un nombre valide supérieur à 0.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    if (!visibility) {
      toast({
        title: 'Erreur',
        description: 'Veuillez définir la visibilité de la recette.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    let finalImageUrl = formData.image_url;
    if (selectedFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else if (!finalImageUrl && !recipe?.image_url) {
        toast({
          title: 'Attention',
          description:
            "L'image n'a pas pu être téléversée. La recette sera sauvegardée sans image.",
          variant: 'default',
        });
      }
    }

    const recipeDataToSubmit = {
      ...formData,
      image_url: finalImageUrl,
      ingredients: formData.ingredients.filter((ing) => ing.name.trim() !== ''),
      calories: parseInt(formData.calories) || 0,
      servings: parseInt(formData.servings, 10) || 1,
      meal_types: Array.isArray(formData.meal_types) ? formData.meal_types : [],
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      instructions: Array.isArray(formData.instructions)
        ? formData.instructions.filter((line) => line.trim() !== '')
        : [],
      visibility: formData.visibility,
    };

    const success = await onSubmit(recipeDataToSubmit);
    if (success) {
      setSelectedFile(null);
      setPreviewImage(null);
    }
    setIsSubmitting(false);
  };


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-white/90"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="bg-white bg-opacity-95 text-pastel-text rounded-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-pastel-border/60">
            <h2 className="text-2xl sm:text-3xl font-semibold text-pastel-primary">
              {recipe ? 'Modifier la recette' : 'Nouvelle recette'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-pastel-muted-foreground hover:bg-pastel-muted/70 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecipeCoreFields
                formData={formData}
                handleInputChange={handleInputChange}
                descriptionRef={descriptionRef}
                handleDescriptionChange={handleDescriptionChange}
              />
              <div className="space-y-6">
                <RecipeMetaFields
                  formData={formData}
                  MEAL_TYPE_OPTIONS_DATA={MEAL_TYPE_OPTIONS_DATA}
                  handleMealTypeToggle={handleMealTypeToggle}
                  showTagManager={showTagManager}
                  setShowTagManager={setShowTagManager}
                  handleAddTag={handleAddTag}
                  handleRemoveTag={handleRemoveTag}
                  suggestedTags={suggestedTags}
                />
                <div className="space-y-2">
                  <Label htmlFor="visibility" className="text-pastel-text/90">
                    Visibilité
                  </Label>
                  <Select
                    onValueChange={handleVisibilityChange}
                    defaultValue={formData.visibility}
                  >
                    <SelectTrigger
                      id="visibility"
                      className="w-full bg-pastel-input border-pastel-input-border focus:border-pastel-input-focus-border"
                    >
                      <SelectValue placeholder="Choisir la visibilité" />
                    </SelectTrigger>
                    <SelectContent className="bg-pastel-popover text-pastel-popover-foreground border-pastel-border">
                      {VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          className="hover:bg-pastel-muted focus:bg-pastel-muted"
                        >
                          <div className="flex items-center">
                            <option.icon className="w-4 h-4 mr-2 text-pastel-accent" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <RecipeIngredientsManager
              ingredients={formData.ingredients}
              handleIngredientChange={handleIngredientChange}
              addIngredient={addIngredient}
              removeIngredient={removeIngredient}
            />

            <RecipeInstructionsManager
              instructions={formData.instructions}
              handleInstructionsChange={handleInstructionsChange}
            />

            <RecipeFormAIFeatures
              isPremiumUser={isPremiumUser}
              generateWithAI={generateWithAI}
              isGeneratingDescription={isGeneratingDescription}
              isGeneratingImage={isGeneratingImage}
              session={session}
            />

            <RecipeFormImageHandler
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              isUploadingImage={isUploadingImage}
              session={session}
              selectedFile={selectedFile}
              previewImage={previewImage}
              formDataName={formData.name}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-pastel-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || isUploadingImage}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || isUploadingImage}
                className="min-w-[120px]"
              >
                {isSubmitting || isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : recipe ? (
                  'Sauvegarder'
                ) : (
                  'Créer Recette'
                )}
              </Button>
            </div>
          </form>

          {showTagManager && (
            <TagManager
              onClose={() => setShowTagManager(false)}
              existingTags={existingTags}
              setExistingTags={setExistingTags}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RecipeForm;
