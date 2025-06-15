import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast.js';

export function useRecipes(session) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const safeSetRecipes = useCallback((data) => {
    setRecipes(Array.isArray(data) ? data : []);
  }, []);

  const baseRecipeSelect = `
    id, user_id, name, description, servings, ingredients, instructions, calories, meal_types, tags, created_at, image_url, visibility, updated_at,
    public_users ( id, email, username, avatar_url, bio )
  `;

  useEffect(() => {
    const loadLocalRecipes = () => {
      const saved = localStorage.getItem("localRecipes");
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
          console.error('Erreur de chargement des recettes utilisateur :', error.message, error.details, error.hint);
          throw error;
        }
        
        const formattedData = data.map(recipe => ({
          ...recipe,
          user: recipe.public_users ? {
            id: recipe.public_users.id,
            email: recipe.public_users.email,
            username: recipe.public_users.username,
            avatar_url: recipe.public_users.avatar_url,
            bio: recipe.public_users.bio,
          } : null
        }));
        safeSetRecipes(formattedData);

      } catch (err) {
        console.error('Erreur fetch recipes :', err);
        toast({ title: 'Erreur', description: "Impossible de charger les recettes: " + err.message, variant: 'destructive' });
        safeSetRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [session, toast, safeSetRecipes, baseRecipeSelect]);
  
  useEffect(() => {
    if (!session?.user?.id) {
      localStorage.setItem("localRecipes", JSON.stringify(recipes));
    }
  }, [recipes, session]);

  const ensureArray = (value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : (value.trim() !== "" ? [value] : []);
      } catch (e) {
        return value.trim() !== "" ? [value] : [];
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
          console.error('Erreur ajout recette (Supabase) :', error.message, error.details, error.hint);
          throw error;
        }
        
        const newRecipe = { 
          ...newRecipeResult, 
          user: newRecipeResult.public_users ? {
            id: newRecipeResult.public_users.id,
            email: newRecipeResult.public_users.email,
            username: newRecipeResult.public_users.username,
            avatar_url: newRecipeResult.public_users.avatar_url,
            bio: newRecipeResult.public_users.bio,
          } : null
        };

        setRecipes(prevRecipes => [newRecipe, ...(Array.isArray(prevRecipes) ? prevRecipes : [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        toast({
          title: "Recette ajoutée",
          description: "Votre nouvelle recette a été enregistrée avec succès.",
        });
        return true;
      } catch (error) {
        console.error("Error adding recipe:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter la recette: " + error.message,
          variant: "destructive",
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
      setRecipes(prevRecipes => [newRecipeWithId, ...(Array.isArray(prevRecipes) ? prevRecipes : [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      toast({
        title: "Recette ajoutée localement",
        description: "Votre nouvelle recette a été enregistrée localement.",
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


        const { data: updatedRecipeResult, error } = await supabase
          .from('recipes')
          .update(payload)
          .eq('id', recipeId)
          .eq('user_id', session.user.id)
          .select(baseRecipeSelect)
          .single();

        if (error) {
          console.error('Erreur modification recette (Supabase) :', error.message, error.details, error.hint);
          throw error;
        }
        
        const updatedRecipe = { 
          ...updatedRecipeResult, 
          user: updatedRecipeResult.public_users ? {
            id: updatedRecipeResult.public_users.id,
            email: updatedRecipeResult.public_users.email,
            username: updatedRecipeResult.public_users.username,
            avatar_url: updatedRecipeResult.public_users.avatar_url,
            bio: updatedRecipeResult.public_users.bio,
          } : null
        };

        setRecipes(prevRecipes => (Array.isArray(prevRecipes) ? prevRecipes : []).map(r => r.id === recipeId ? updatedRecipe : r).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        toast({
          title: "Recette modifiée",
          description: "Votre recette a été mise à jour avec succès.",
        });
        return true;
      } catch (error) {
        console.error("Error updating recipe:", error);
        toast({
          title: "Erreur",
          description: "Impossible de modifier la recette: " + error.message,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    } else {
       const currentRecipes = Array.isArray(recipes) ? recipes : [];
       const recipeToUpdate = currentRecipes.find(r => r.id === recipeId);
       const updatedLocalRecipe = { 
         ...recipeToUpdate, 
         ...recipeData, 
         servings: parseInt(recipeData.servings, 10) || 1,
         meal_types: ensureArray(recipeData.meal_types),
         tags: ensureArray(recipeData.tags),
         instructions: ensureArray(recipeData.instructions),
         visibility: recipeData.visibility || 'private',
        };
      setRecipes(prevRecipes => (Array.isArray(prevRecipes) ? prevRecipes : []).map(r => r.id === recipeId ? updatedLocalRecipe : r).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      toast({
        title: "Recette modifiée localement",
        description: "Votre recette a été mise à jour localement.",
      });
      setLoading(false);
      return true;
    }
  };

  const deleteRecipe = async (recipeId) => {
    setLoading(true);
    if (session?.user?.id) {
      try {
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', recipeId)
          .eq('user_id', session.user.id);
        if (error) {
          console.error('Erreur suppression recette (Supabase) :', error.message, error.details, error.hint);
          throw error;
        }
        setRecipes(prevRecipes => (Array.isArray(prevRecipes) ? prevRecipes : []).filter(r => r.id !== recipeId));
        toast({
          title: "Recette supprimée",
          description: "La recette a été supprimée avec succès.",
        });
      } catch (error) {
        console.error("Error deleting recipe:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la recette: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setRecipes(prevRecipes => (Array.isArray(prevRecipes) ? prevRecipes : []).filter(r => r.id !== recipeId));
      toast({
        title: "Recette supprimée localement",
        description: "La recette a été supprimée localement.",
      });
      setLoading(false);
    }
  };

  return { recipes, addRecipe, updateRecipe, deleteRecipe, setRecipes: safeSetRecipes, loading };
}