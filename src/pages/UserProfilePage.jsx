import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import RecipeList from '@/components/RecipeList';
import LoadingScreen from '@/components/layout/LoadingScreen';
import {
  UserCircle,
  Calendar,
  ArrowLeft,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RecipeDetailModal from '@/components/RecipeDetailModal';

export default function UserProfilePage({ session, currentUserProfile }) {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState(null);
  const [relationshipId, setRelationshipId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
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

      const formattedRecipes = recipeData.map((r) => ({
        ...r,
        user: r.author,
      }));
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

  const handleFriendAction = async () => {
    if (!session?.user?.id) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour gérer les amis.',
        variant: 'default',
      });
      return;
    }
    setActionLoading(true);
    try {
      if (relationshipStatus === 'not_friends') {
        const { data, error } = await supabase
          .from('user_relationships')
          .insert({
            requester_id: session.user.id,
            addressee_id: userId,
            status: 'pending',
          })
          .select()
          .single();
        if (error) throw error;
        setRelationshipId(data.id);
        setRelationshipStatus('pending_them');
        toast({
          title: 'Demande envoyée',
          description: `Demande d'ami envoyée à ${profileData.username}.`,
        });
      } else if (relationshipStatus === 'pending_me') {
        const { error } = await supabase
          .from('user_relationships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', relationshipId);
        if (error) throw error;
        setRelationshipStatus('friends');
        toast({
          title: 'Demande acceptée',
          description: `Vous êtes maintenant amis avec ${profileData.username}.`,
        });
      } else if (
        relationshipStatus === 'pending_them' ||
        relationshipStatus === 'friends'
      ) {
        const { error } = await supabase
          .from('user_relationships')
          .delete()
          .eq('id', relationshipId);
        if (error) throw error;
        setRelationshipStatus('not_friends');
        setRelationshipId(null);
        toast({
          title:
            relationshipStatus === 'friends'
              ? 'Ami supprimé'
              : 'Demande annulée',
        });
      }
      // No full refetch here, just update local state for relationship
    } catch (error) {
      console.error('Friend action error:', error);
      let userFriendlyMessage = "Une action d'ami a échoué.";
      if (
        error.message.includes(
          'violates unique constraint "unique_relationship"'
        )
      ) {
        userFriendlyMessage =
          "Une demande d'ami existe déjà ou vous êtes déjà amis.";
        // Attempt to refetch to get the correct current state
        fetchProfileAndRecipes();
      } else if (
        error.message.includes(
          'violates check constraint "check_different_users"'
        )
      ) {
        userFriendlyMessage =
          'Vous ne pouvez pas vous ajouter vous-même en ami.';
      } else {
        userFriendlyMessage = error.message;
      }
      toast({
        title: 'Erreur',
        description: userFriendlyMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

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

  const getFriendButton = () => {
    if (actionLoading)
      return (
        <Button disabled className="mt-4 w-40">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
        </Button>
      );
    switch (relationshipStatus) {
      case 'friends':
        return (
          <Button
            onClick={handleFriendAction}
            variant="secondary"
            className="mt-4 w-40"
          >
            <UserX className="mr-2 h-4 w-4" /> Retirer l&apos;ami
          </Button>
        );
      case 'pending_them':
        return (
          <Button
            onClick={handleFriendAction}
            variant="outline"
            className="mt-4 w-40"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Demande envoyée
          </Button>
        );
      case 'pending_me':
        return (
          <Button
            onClick={handleFriendAction}
            variant="default"
            className="mt-4 w-40"
          >
            <UserCheck className="mr-2 h-4 w-4" /> Accepter la demande
          </Button>
        );
      default:
        return (
          <Button
            onClick={handleFriendAction}
            variant="default"
            className="mt-4 w-40"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Ajouter en ami
          </Button>
        );
    }
  };

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
              {!isOwnProfile && session && getFriendButton()}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-pastel-secondary mb-6">
            Recettes de {profileData.username} ({recipes.length})
          </h2>
          {recipes.length > 0 ? (
            <RecipeList
              recipes={recipes}
              onEdit={() =>
                toast({
                  title: '🚧 Action non disponible',
                  description:
                    'Vous ne pouvez pas modifier les recettes d&apos;un autre utilisateur.',
                  variant: 'default',
                })
              }
              onDelete={() =>
                toast({
                  title: '🚧 Action non disponible',
                  description:
                    'Vous ne pouvez pas supprimer les recettes d&apos;un autre utilisateur.',
                  variant: 'default',
                })
              }
              onSelectRecipe={setSelectedRecipeForDetail}
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
