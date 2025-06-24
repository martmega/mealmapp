import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { X, Loader2, Eye, EyeOff, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TagManager from '@/components/TagManager';
import { generateTagSuggestions } from '@/lib/tagSuggestions';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import RecipeFormImageHandler from '@/components/RecipeFormImageHandler';
import RecipeFormAIFeatures from '@/components/RecipeFormAIFeatures';
import RecipeCoreFields from '@/components/form/RecipeCoreFields';
import RecipeIngredientsManager from '@/components/form/RecipeIngredientsManager';
import RecipeInstructionsManager from '@/components/form/RecipeInstructionsManager';
import RecipeMetaFields from '@/components/form/RecipeMetaFields';
import { estimateRecipePrice } from '@/lib/openai';
import { getSignedImageUrl } from '@/lib/images';
import { SUPABASE_BUCKETS } from '@/config/constants';

const supabase = getSupabase();
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
  const [showTagManager, setShowTagManager] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [existingTags, setExistingTags] = useState(() => {
    const saved = localStorage.getItem('existingTags');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();
  const descriptionRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const subscriptionTier = userProfile?.subscription_tier;
  const [iaUsage, setIaUsage] = useState(null);

  const fetchIaUsage = useCallback(async () => {
    if (subscriptionTier !== 'vip' || !session?.user?.id) {
      setIaUsage(null);
      return;
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data, error } = await supabase
      .from('ia_usage')
      .select('text_requests, image_requests')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .single();
    if (!error) {
      setIaUsage(data);
    } else {
      setIaUsage(null);
    }
  }, [session, subscriptionTier]);

  useEffect(() => {
    fetchIaUsage();
  }, [fetchIaUsage]);

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
        visibility:
          recipe.visibility ?? (recipe.is_public ? 'public' : 'private'),
      });
      if (descriptionRef.current && recipe.description) {
        descriptionRef.current.value = recipe.description;
      }
      if (recipe.image_url) {
        if (recipe.image_url.startsWith('http')) {
          setPreviewImage(recipe.image_url);
        } else {
          getSignedImageUrl(SUPABASE_BUCKETS.recipes, recipe.image_url).then(
            setPreviewImage
          );
        }
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

  // Restore draft on mount when creating a new recipe
  useEffect(() => {
    if (!recipe) {
      const savedDraft = localStorage.getItem('draft_recipe');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const confirmRestore = window.confirm(
            'Un brouillon de recette a été trouvé. Voulez-vous le restaurer ?'
          );
          if (confirmRestore) {
            setFormData({ ...initialFormData, ...parsed });
            if (descriptionRef.current && parsed.description) {
              descriptionRef.current.value = parsed.description;
            }
            if (parsed.image_url) {
              if (parsed.image_url.startsWith('http')) {
                setPreviewImage(parsed.image_url);
              } else {
                getSignedImageUrl(SUPABASE_BUCKETS.recipes, parsed.image_url).then(
                  setPreviewImage
                );
              }
            }
          } else {
            localStorage.removeItem('draft_recipe');
          }
        } catch (e) {
          console.error('Erreur lors de la restauration du brouillon', e);
          localStorage.removeItem('draft_recipe');
        }
      }
    }
  }, [recipe]);

  // Autosave draft whenever form data changes (for new recipe)
  useEffect(() => {
    if (!recipe) {
      localStorage.setItem('draft_recipe', JSON.stringify(formData));
    }
  }, [formData, recipe]);

  const updateSuggestedTags = useCallback(async () => {
    const localExistingTags = JSON.parse(
      localStorage.getItem('existingTags') || '[]'
    );
    let baseSuggestions = [];
    if (
      formData.ingredients.some((i) => i.name) ||
      formData.meal_types.length > 0 ||
      formData.name
    ) {
      baseSuggestions = await generateTagSuggestions(
        { ...formData, mealTypes: formData.meal_types },
        localExistingTags
      );
    }

    const combinedSuggestions = Array.from(
      new Set([...localExistingTags, ...baseSuggestions])
    );
    setSuggestedTags(
      combinedSuggestions.filter((tag) => !formData.tags.includes(tag))
    );
  }, [formData.ingredients, formData.meal_types, formData.tags, formData.name]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      updateSuggestedTags();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [updateSuggestedTags]);

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

  const handleAddTag = (tag) => {
    if (tag && tag.trim() && !formData.tags.includes(tag.trim())) {
      const newTag = tag.trim();
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      if (!existingTags.includes(newTag)) {
        const updatedSystemTags = Array.from(
          new Set([...existingTags, newTag])
        );
        setExistingTags(updatedSystemTags);
        localStorage.setItem('existingTags', JSON.stringify(updatedSystemTags));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: "L'image ne doit pas dépasser 5MB.",
          variant: 'destructive',
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Format de fichier non supporté',
          description: 'Veuillez choisir une image JPEG, PNG, ou WEBP.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, image_url: '' }));
    }
  };

  const uploadImage = async () => {
    if (!selectedFile || !session?.user) return null;
    setIsUploadingImage(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKETS.recipes)
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setIsUploadingImage(false);
      toast({
        title: 'Image téléversée',
        description: 'Votre image a été ajoutée à la recette.',
      });
      return data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur de téléversement',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploadingImage(false);
      return null;
    }
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

    const cleanedNewIngredients = formData.ingredients
      .filter((ing) => ing.name.trim() !== '')
      .map(({ name, quantity, unit }) => ({ name, quantity, unit }));

    const cleanedPrevIngredients = Array.isArray(recipe?.ingredients)
      ? recipe.ingredients
          .filter((ing) => ing.name?.trim() !== '')
          .map(({ name, quantity, unit }) => ({ name, quantity, unit }))
      : [];

    const ingredientsChanged =
      JSON.stringify(cleanedPrevIngredients) !==
      JSON.stringify(cleanedNewIngredients);
    const servingsChanged = recipe
      ? parseInt(formData.servings, 10) !== parseInt(recipe.servings, 10)
      : false;

    // Trigger a new price estimate only when necessary: on creation or when
    // the ingredient list or base servings differ from the original recipe.
    const shouldEstimate =
      !recipe ||
      recipe.estimated_price === undefined ||
      recipe.estimated_price === null ||
      ingredientsChanged ||
      servingsChanged;

    let estimated = recipe?.estimated_price ?? null;
    if (shouldEstimate && subscriptionTier === 'premium') {
      estimated = await estimateRecipePrice(
        {
          ingredients: cleanedNewIngredients,
          servings: parseInt(formData.servings, 10) || 1,
        },
        userProfile.subscription_tier,
        session
      );
    }

    let finalImageUrl = formData.image_url;
    if (selectedFile) {
      const uploadedPath = await uploadImage();
      if (uploadedPath) {
        finalImageUrl = uploadedPath;
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
      estimated_price: estimated !== null ? estimated : undefined,
    };

    const success = await onSubmit(recipeDataToSubmit);
    if (success) {
      setSelectedFile(null);
      setPreviewImage(null);
      if (!recipe) {
        localStorage.removeItem('draft_recipe');
      }
    }
    setIsSubmitting(false);
  };

  const handlePremiumFeatureClick = (featureName) => {
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
  };

  const generateWithAI = async (type) => {
    if (!session) {
      toast({
        title: 'Connexion requise',
        description:
          'Veuillez vous connecter pour utiliser les fonctionnalités IA.',
        variant: 'default',
      });
      return;
    }

    if (subscriptionTier !== 'premium' && subscriptionTier !== 'vip') {
      handlePremiumFeatureClick(
        type === 'description' ? 'de description' : "d'images"
      );
      return;
    }

    if (subscriptionTier === 'vip') {
      if (
        (type === 'description' && (iaUsage?.text_requests ?? 0) >= 20) ||
        (type === 'image' && (iaUsage?.image_requests ?? 0) >= 5)
      ) {
        toast({
          title: 'Quota IA dépassé',
          description: `Vous avez atteint la limite de ${
            type === 'description' ? 'descriptions' : 'images'
          } pour ce mois.`,
          variant: 'destructive',
        });
        return;
      }
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
      const endpoint =
        type === 'description'
          ? '/api/generate-description'
          : '/api/generate-image';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-subscription-tier': subscriptionTier,
        },
        body: JSON.stringify({
          recipe: {
            title: formData.name,
            ingredients: formData.ingredients
              .filter((ing) => ing.name)
              .map((ing) => ing.name),
            instructions: Array.isArray(formData.instructions)
              ? formData.instructions.join(' ')
              : formData.instructions,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Request failed');
      }

      const data = await response.json();

      if (type === 'description') {
        const generatedDescription = data.description;
        setFormData((prev) => ({ ...prev, description: generatedDescription }));
        if (descriptionRef.current)
          descriptionRef.current.value = generatedDescription;
        toast({
          title: 'Description générée',
          description: 'La description a été mise à jour.',
        });
        if (subscriptionTier === 'vip') {
          setIaUsage((prev) => ({
            ...prev,
            text_requests: (prev?.text_requests ?? 0) + 1,
          }));
        }
      } else if (type === 'image') {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
        setPreviewImage(data.url);
        setSelectedFile(null);
        toast({
          title: 'Image générée',
          description: "L'image a été mise à jour.",
        });
        if (subscriptionTier === 'vip') {
          setIaUsage((prev) => ({
            ...prev,
            image_requests: (prev?.image_requests ?? 0) + 1,
          }));
        }
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
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/30 dark:bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="bg-white dark:bg-zinc-900 text-pastel-text dark:text-neutral-100 rounded-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg"
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
              subscription_tier={subscriptionTier}
              generateWithAI={generateWithAI}
              isGeneratingDescription={isGeneratingDescription}
              isGeneratingImage={isGeneratingImage}
              session={session}
              formData={formData}
              handleDescriptionChange={handleDescriptionChange}
              descriptionRef={descriptionRef}
              iaUsage={iaUsage}
            />

            <RecipeFormImageHandler
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              isUploadingImage={isUploadingImage}
              session={session}
              selectedFile={selectedFile}
              previewImage={previewImage}
              formDataName={formData.name}
              subscription_tier={subscriptionTier}
              generateWithAI={generateWithAI}
              isGeneratingImage={isGeneratingImage}
              iaUsage={iaUsage}
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
              session={session}
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

RecipeForm.propTypes = {
  recipe: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    servings: PropTypes.number,
    calories: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ingredients: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unit: PropTypes.string,
        suggestedUnits: PropTypes.arrayOf(PropTypes.string),
      })
    ),
    instructions: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
    tags: PropTypes.arrayOf(PropTypes.string),
    image_url: PropTypes.string,
    meal_types: PropTypes.arrayOf(PropTypes.string),
    visibility: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.object,
  userProfile: PropTypes.shape({
    subscription_tier: PropTypes.string,
  }),
};

export default RecipeForm;
