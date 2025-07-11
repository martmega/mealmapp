import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import RecipeList from '@/components/RecipeList';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { UserCircle, ShieldCheck } from 'lucide-react';
import SignedImage from '@/components/SignedImage';
import { DEFAULT_AVATAR_URL } from '@/lib/images';
import { SUPABASE_BUCKETS } from '@/config/constants.client';
import { useToast } from '@/components/ui/use-toast';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatRecipe } from '@/lib/formatRecipe';

const supabase = getSupabase();

export default function MyPublicProfile({
  session,
  userProfile: initialUserProfile,
}) {
  const [profileData, setProfileData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMyProfileData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url, bio, subscription_tier')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;
      setProfileData({
        ...user,
        username: user.username || user.id.substring(0, 8),
      });

      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select(
          'id, user_id, name, description, servings, ingredients, instructions, calories, meal_types, tags, created_at, image_url, visibility'
        )
        .eq('user_id', session.user.id)
        .in('visibility', ['public', 'friends_only'])
        .order('created_at', { ascending: false });

      if (recipeError) throw recipeError;

      const userIds = [...new Set(recipeData.map((r) => r.user_id))];
      const { data: users } = await supabase
        .from('public_user_view')
        .select('id, username, avatar_url, bio, subscription_tier')
        .in('id', userIds);
      const usersMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

      const formattedRecipes = recipeData.map((r) =>
        formatRecipe({ ...r, user: usersMap[r.user_id] ?? null })
      );
      setRecipes(formattedRecipes || []);
    } catch (error) {
      console.error('Error fetching own profile or recipes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre profil ou vos recettes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    if (initialUserProfile && initialUserProfile.id === session?.user?.id) {
      setProfileData(initialUserProfile);
      fetchMyProfileData(); // Still fetch recipes and potentially more details
    } else if (session?.user?.id) {
      fetchMyProfileData();
    } else {
      setLoading(false);
    }
  }, [initialUserProfile, session, fetchMyProfileData]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const recipeIdToOpen = queryParams.get('recipe');
    if (recipeIdToOpen && recipes.length > 0) {
      const recipe = recipes.find((r) => r.id === recipeIdToOpen);
      if (recipe) {
        setSelectedRecipeForDetail(recipe);
        const newPath = location.pathname; // Keep current path, remove query param
        navigate(newPath, { replace: true });
      }
    }
  }, [location.search, recipes, location.pathname, navigate]);

  if (loading) {
    return <LoadingScreen message="Chargement de votre profil public..." />;
  }

  if (!profileData && !session?.user?.id) {
    return (
      <div className="text-center py-12 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
        <h1 className="text-2xl font-bold text-pastel-primary mb-4">
          Non connecté
        </h1>
        <p className="text-pastel-muted-foreground">
          Veuillez vous connecter pour voir votre aperçu de profil.
        </p>
      </div>
    );
  }

  if (!profileData && session?.user?.id) {
    return (
      <div className="text-center py-12 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
        <h1 className="text-2xl font-bold text-pastel-primary mb-4">
          Erreur de chargement
        </h1>
        <p className="text-pastel-muted-foreground">
          Impossible de charger votre profil. Veuillez réessayer.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 mt-6">
        <div className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 mb-8">
            {profileData.avatar_url ? (
              <SignedImage
                bucket={SUPABASE_BUCKETS.avatars}
                path={profileData.avatar_url}
                alt={`Avatar de ${profileData.username}`}
                fallback={DEFAULT_AVATAR_URL}
                className="w-32 h-32 rounded-full object-cover border-4 border-pastel-primary shadow-lg"
              />
            ) : (
              <UserCircle className="w-32 h-32 text-pastel-muted-foreground border-4 border-pastel-primary rounded-full p-2" />
            )}
            <div className="flex-grow text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-pastel-primary">
                  {profileData.username}
                </h1>
                <ShieldCheck
                  className="w-7 h-7 text-pastel-tertiary"
                  title="Ceci est votre aperçu de profil public"
                />
              </div>
              {profileData.bio && (
                <p className="text-pastel-text/80 mb-3">{profileData.bio}</p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-pastel-muted-foreground"></div>
              <p className="text-xs text-pastel-muted-foreground mt-3 italic">
                C'est ainsi que les autres utilisateurs voient votre profil
                (recettes publiques et pour amis).
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-pastel-secondary mb-6">
            Vos Recettes Visibles Publiquement ({recipes.length})
          </h2>
          {recipes.length > 0 ? (
            <RecipeList
              recipes={recipes}
              onEdit={() => navigate('/app/recipes')}
              onDelete={() => navigate('/app/recipes')}
              onSelectRecipe={setSelectedRecipeForDetail}
            />
          ) : (
            <div className="text-center py-10 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
              <p className="text-xl text-pastel-muted-foreground">
                Vous n'avez pas encore partagé de recettes (ou elles sont toutes
                privées).
              </p>
            </div>
          )}
        </div>
      </div>
      {selectedRecipeForDetail && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetail}
          onClose={() => setSelectedRecipeForDetail(null)}
          userProfile={profileData}
        />
      )}
    </>
  );
}
