import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';
import { ToastAction } from '@/components/ui/toast.jsx';
import { estimateRecipePrice } from '@/lib/openai';

export function useRecipes(session, subscriptionTier) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const pendingDeletions = useRef({});

  const safeSetRecipes = useCallback((data) => {
    setRecipes(Array.isArray(data) ? data : []);
  }, []);

  const baseRecipeSelect = `
    id, user_id, name, description, servings, ingredients, instructions, calories, meal_types, tags, created_at, image_url, visibility, updated_at, estimated_price
  `;

  useEffect(() => {
    const loadLocalRecipes = () => {
      const saved = localStorage.getItem('localRecipes');
      safeSetRecipes(saved ? JSON.parse(saved) : []);
      setLoading(false);
    };

    if (!session?.user?.id) {
      loadLocalRecipes();
      return;
    }

    const fetchUserRecipes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select(baseRecipeSelect)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(
            'Erreur de chargement des recettes utilisateur :',
            error.message,
            error.details,
            error.hint
          );
          throw error;
        }

        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: users } = await supabase
          .from('public_user_view')
          .select('id, username, avatar_url, bio, subscription_tier')
          .in('id', userIds);

        const usersMap = Object.fromEntries(
          (users || []).map((u) => [u.id, u])
        );

        const formattedData = data.map((recipe) => ({
          ...recipe,
          user: usersMap[recipe.user_id] ?? null,
        }));
        safeSetRecipes(formattedData);
      } catch (err) {
        console.error('Erreur fetch recipes :', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les recettes: ' + err.message,
          variant: 'destructive',
        });
        safeSetRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [session, toast, safeSetRecipes, baseRecipeSelect]);

  useEffect(() => {
    if (!session?.user?.id) {
      localStorage.setItem('localRecipes', JSON.stringify(recipes));
    }
  }, [recipes, session, subscriptionTier]);

  useEffect(() => {
    const estimateMissingPrices = async () => {
      if (subscriptionTier !== 'premium') return;
      for (const recipe of Array.isArray(recipes) ? recipes : []) {
        if (
          recipe &&
          (recipe.estimated_price === undefined ||
            recipe.estimated_price === null)
        ) {
          const estimated = await estimateRecipePrice(
            {
              ingredients: Array.isArray(recipe.ingredients)
                ? recipe.ingredients.filter((ing) => ing.name?.trim() !== '')
                : [],
              servings: parseInt(recipe.servings, 10) || 1,
            },
            subscriptionTier
          );

          if (estimated !== null) {
            setRecipes((prev) =>
              (Array.isArray(prev) ? prev : []).map((r) =>
                r.id === recipe.id ? { ...r, estimated_price: estimated } : r
              )
            );

            if (
              session?.user?.id &&
              !recipe.id.toString().startsWith('local_')
            ) {
              await supabase
                .from('recipes')
                .update({ estimated_price: estimated })
                .eq('id', recipe.id)
                .eq('user_id', session.user.id);
            }
          }
        }
      }
    };

    estimateMissingPrices();
  }, [recipes, session]);

  const ensureArray = (value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed
          : value.trim() !== ''
            ? [value]
            : [];
      } catch (e) {
        return value.trim() !== '' ? [value] : [];
      }
    }
    return Array.isArray(value) ? value : [];
  };

  const addRecipe = async (recipeData) => {
    setLoading(true);
    if (session?.user?.id) {
      try {
        const payload = {
          ...recipeData,
          user_id: session.user.id,
          servings: parseInt(recipeData.servings, 10) || 1,
          meal_types: ensureArray(recipeData.meal_types),
          tags: ensureArray(recipeData.tags),
          instructions: ensureArray(recipeData.instructions),
          created_at: new Date().toISOString(),
          visibility: recipeData.visibility || 'private',
        };

        if ('mealTypes' in payload) {
          delete payload.mealTypes;
        }
        if ('user' in payload) {
          delete payload.user;
        }
        if ('public_users' in payload) {
          delete payload.public_users;
        }

        const { data: newRecipeResult, error } = await supabase
          .from('recipes')
          .insert([payload])
          .select(baseRecipeSelect)
          .single();

        if (error) {
          console.error(
            'Erreur ajout recette (Supabase) :',
            error.message,
            error.details,
            error.hint
          );
          throw error;
        }

        const { data: user } = await supabase
          .from('public_user_view')
          .select('id, username, avatar_url, bio, subscription_tier')
          .eq('id', newRecipeResult.user_id)
          .single();

        const newRecipe = {
          ...newRecipeResult,
          user: user || null,
        };

        setRecipes((prevRecipes) =>
          [newRecipe, ...(Array.isArray(prevRecipes) ? prevRecipes : [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
        );
        toast({
          title: 'Recette ajoutée',
          description: 'Votre nouvelle recette a été enregistrée avec succès.',
        });
        return true;
      } catch (error) {
        console.error('Error adding recipe:', error);
        toast({
          title: 'Erreur',
          description: "Impossible d'ajouter la recette: " + error.message,
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      const newRecipeWithId = {
        ...recipeData,
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        servings: parseInt(recipeData.servings, 10) || 1,
        meal_types: ensureArray(recipeData.meal_types),
        tags: ensureArray(recipeData.tags),
        instructions: ensureArray(recipeData.instructions),
        visibility: recipeData.visibility || 'private',
      };
      setRecipes((prevRecipes) =>
        [
          newRecipeWithId,
          ...(Array.isArray(prevRecipes) ? prevRecipes : []),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
      toast({
        title: 'Recette ajoutée localement',
        description: 'Votre nouvelle recette a été enregistrée localement.',
      });
      setLoading(false);
      return true;
    }
  };

  const updateRecipe = async (recipeId, recipeData) => {
    setLoading(true);
    if (session?.user?.id) {
      try {
        const payload = {
          ...recipeData,
          servings: parseInt(recipeData.servings, 10) || 1,
          meal_types: ensureArray(recipeData.meal_types),
          tags: ensureArray(recipeData.tags),
          instructions: ensureArray(recipeData.instructions),
          visibility: recipeData.visibility || 'private',
        };
        if ('mealTypes' in payload) {
          delete payload.mealTypes;
        }
        delete payload.created_at;
        delete payload.user_id;
        delete payload.user;
        delete payload.public_users;

        console.log('Updating recipe with', {
          id: recipeId,
          user_id: session.user.id,
          data: payload,
        });

        const { data: updatedRecipeResult, error } = await supabase
          .from('recipes')
          .update(payload)
          .eq('id', recipeId)
          .eq('user_id', session.user.id)
          .select(baseRecipeSelect)
          .maybeSingle();

        if (error) {
          console.error(
            'Erreur modification recette (Supabase) :',
            error.message,
            error.details,
            error.hint
          );
          throw error;
        }

        const { data: user } = await supabase
          .from('public_user_view')
          .select('id, username, avatar_url, bio, subscription_tier')
          .eq('id', updatedRecipeResult.user_id)
          .single();

        const updatedRecipe = {
          ...updatedRecipeResult,
          user: user || null,
        };

        setRecipes((prevRecipes) =>
          (Array.isArray(prevRecipes) ? prevRecipes : [])
            .map((r) => (r.id === recipeId ? updatedRecipe : r))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
        toast({
          title: 'Recette modifiée',
          description: 'Votre recette a été mise à jour avec succès.',
        });
        return true;
      } catch (error) {
        console.error('Error updating recipe:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier la recette: ' + error.message,
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      const currentRecipes = Array.isArray(recipes) ? recipes : [];
      const recipeToUpdate = currentRecipes.find((r) => r.id === recipeId);
      const updatedLocalRecipe = {
        ...recipeToUpdate,
        ...recipeData,
        servings: parseInt(recipeData.servings, 10) || 1,
        meal_types: ensureArray(recipeData.meal_types),
        tags: ensureArray(recipeData.tags),
        instructions: ensureArray(recipeData.instructions),
        visibility: recipeData.visibility || 'private',
      };
      setRecipes((prevRecipes) =>
        (Array.isArray(prevRecipes) ? prevRecipes : [])
          .map((r) => (r.id === recipeId ? updatedLocalRecipe : r))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
      toast({
        title: 'Recette modifiée localement',
        description: 'Votre recette a été mise à jour localement.',
      });
      setLoading(false);
      return true;
    }
  };

  const undoDelete = useCallback(
    (id) => {
      const pending = pendingDeletions.current[id];
      if (!pending) return;
      clearTimeout(pending.timer);
      pending.dismiss();
      setRecipes((prev) =>
        [pending.recipe, ...(Array.isArray(prev) ? prev : [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
      delete pendingDeletions.current[id];
      toast({
        title: 'Suppression annulée',
        description: 'La recette a été restaurée.',
      });
    },
    [toast]
  );

  const deleteRecipe = async (recipeId) => {
    setLoading(true);
    const recipeToDelete = (Array.isArray(recipes) ? recipes : []).find(
      (r) => r.id === recipeId
    );
    if (!recipeToDelete) return;

    setRecipes((prevRecipes) =>
      (Array.isArray(prevRecipes) ? prevRecipes : []).filter(
        (r) => r.id !== recipeId
      )
    );

    const { dismiss } = toast({
      title: 'Recette supprimée',
      description: 'La recette a été supprimée.',
      action: (
        <ToastAction altText="Annuler" onClick={() => undoDelete(recipeId)}>
          Annuler
        </ToastAction>
      ),
      duration: 5000,
    });

    const timer = setTimeout(async () => {
      if (session?.user?.id && !recipeId.toString().startsWith('local_')) {
        try {
          const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', recipeId)
            .eq('user_id', session.user.id);
          if (error) {
            console.error(
              'Erreur suppression recette (Supabase) :',
              error.message,
              error.details,
              error.hint
            );
          }
        } catch (error) {
          console.error('Error deleting recipe:', error);
        }
      }
      dismiss();
      delete pendingDeletions.current[recipeId];
    }, 5000);

    pendingDeletions.current[recipeId] = {
      recipe: recipeToDelete,
      timer,
      dismiss,
    };
    setLoading(false);
  };

  return {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    setRecipes: safeSetRecipes,
    loading,
  };
}
