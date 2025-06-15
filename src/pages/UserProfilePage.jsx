import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import UserRecipeList from '@/components/UserRecipeList.jsx';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { UserCircle, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import FriendActionButton from '@/components/FriendActionButton.jsx';
import { formatRecipe } from '@/lib/formatRecipe';

export default function UserProfilePage({ session, currentUserProfile }) {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState(null);
  const [relationshipId, setRelationshipId] = useState(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);

  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchProfileAndRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('public_users')
        .select('id, created_at, username, avatar_url, bio, user_tag') // Added user_tag
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setProfileData({
        ...user,
        username: user.username || user.id.substring(0, 8),
      });

      let recipesQuery = supabase
        .from('recipes')
        .select(
          `
          id, user_id, name, description, servings, ingredients, instructions, calories, meal_types, tags, created_at, image_url, visibility,
          author:public_users (id, username, avatar_url)
        `
        )
        .eq('user_id', userId);

      let currentRelationshipStatus = 'not_friends';
      let relId = null;

      if (session?.user?.id && session.user.id !== userId) {
        const { data: rel, error: relError } = await supabase
          .from('user_relationships')
          .select('id, requester_id, addressee_id, status')
          .or(
            `(requester_id.eq.${session.user.id},addressee_id.eq.${userId}),(requester_id.eq.${userId},addressee_id.eq.${session.user.id})`
          )
          .maybeSingle();

        if (relError && relError.code !== 'PGRST116') {
          console.warn('Error fetching relationship:', relError.message);
        } else if (rel) {
          relId = rel.id;
          if (rel.status === 'accepted') {
            currentRelationshipStatus = 'friends';
          } else if (rel.status === 'pending') {
            currentRelationshipStatus =
              rel.requester_id === session.user.id
                ? 'pending_them'
                : 'pending_me';
          }
        }
      }
      setRelationshipStatus(currentRelationshipStatus);
      setRelationshipId(relId);

      if (session?.user?.id === userId) {
        recipesQuery = recipesQuery.in('visibility', [
          'public',
          'private',
          'friends_only',
        ]);
      } else if (currentRelationshipStatus === 'friends') {
        recipesQuery = recipesQuery.in('visibility', [
          'public',
          'friends_only',
        ]);
      } else {
        recipesQuery = recipesQuery.eq('visibility', 'public');
      }

      const { data: recipeData, error: recipeError } = await recipesQuery.order(
        'created_at',
        { ascending: false }
      );
      if (recipeError) throw recipeError;

      const formattedRecipes = recipeData.map((r) => formatRecipe(r));
      setRecipes(formattedRecipes || []);
    } catch (error) {
      console.error('Error fetching profile or recipes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le profil ou les recettes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, session, toast]);

  useEffect(() => {
    if (userId) {
      fetchProfileAndRecipes();
    }
  }, [fetchProfileAndRecipes, userId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const recipeIdToOpen = queryParams.get('recipe');
    if (recipeIdToOpen && recipes.length > 0) {
      const recipe = recipes.find((r) => r.id === recipeIdToOpen);
      if (recipe) {
        setSelectedRecipeForDetail(recipe);
        const newPath = location.pathname;
        navigate(newPath, { replace: true });
      }
    }
  }, [location.search, recipes, location.pathname, navigate]);


  if (loading) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  if (!profileData) {
    return (
      <div className="text-center py-12 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
        <h1 className="text-2xl font-bold text-pastel-primary mb-4">
          Profil introuvable
        </h1>
        <p className="text-pastel-muted-foreground">
          L&apos;utilisateur que vous cherchez n&apos;existe pas ou une erreur
          est survenue.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/app/community">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la communauté
          </Link>
        </Button>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === userId;


  return (
    <>
      <div className="space-y-8">
        <div className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            {profileData.avatar_url ? (
              <img
                src={profileData.avatar_url}
                alt={`Avatar de ${profileData.username}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-pastel-primary shadow-lg"
              />
            ) : (
              <UserCircle className="w-32 h-32 text-pastel-muted-foreground border-4 border-pastel-primary rounded-full p-2" />
            )}
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-1">
                {profileData.username}
              </h1>
              {profileData.user_tag && (
                <p className="text-sm text-pastel-muted-foreground font-mono mb-1">
                  @{profileData.user_tag}
                </p>
              )}
              {profileData.bio && (
                <p className="text-pastel-text/80 mb-3">{profileData.bio}</p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-pastel-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" /> Membre depuis{' '}
                  {new Date(profileData.created_at).toLocaleDateString()}
                </span>
              </div>
              {!isOwnProfile && session && (
                <FriendActionButton
                  session={session}
                  profileUserId={userId}
                  initialStatus={relationshipStatus}
                  relationshipId={relationshipId}
                  onStatusChange={(s, id) => {
                    setRelationshipStatus(s);
                    setRelationshipId(id);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-pastel-secondary mb-6">
            Recettes de {profileData.username} ({recipes.length})
          </h2>
          {recipes.length > 0 ? (
            <UserRecipeList
              recipes={recipes}
              onSelectRecipe={setSelectedRecipeForDetail}
              onToast={(type) =>
                toast({
                  title: '🚧 Action non disponible',
                  description:
                    type === 'edit'
                      ? "Vous ne pouvez pas modifier les recettes d'un autre utilisateur."
                      : "Vous ne pouvez pas supprimer les recettes d'un autre utilisateur.",
                  variant: 'default',
                })
              }
            />
          ) : (
            <div className="text-center py-10 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
              <p className="text-xl text-pastel-muted-foreground">
                {profileData.username} n&apos;a pas encore partagé de recettes.
              </p>
            </div>
          )}
        </div>
      </div>
      {selectedRecipeForDetail && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetail}
          onClose={() => setSelectedRecipeForDetail(null)}
          userProfile={currentUserProfile}
        />
      )}
    </>
  );
}
