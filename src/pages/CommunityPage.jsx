import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRecipes } from '@/lib/formatRecipe.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCircle,
  Search,
  Loader2,
  Utensils,
  Users,
  Compass,
  Eye,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RecipeList from '@/components/RecipeList';
import LoadingScreen from '@/components/layout/LoadingScreen';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.jsx';
import FriendsTab from '@/components/FriendsTab.jsx';
import MyPublicProfile from '@/components/MyPublicProfile.jsx';

export default function CommunityPage({ session, userProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('discover');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const { data, error } = await supabase
        .from('public_users')
        .select('id, username, avatar_url, user_tag')
        .or(
          `username.ilike.%${trimmedSearchTerm}%,user_tag.ilike.%${trimmedSearchTerm}%`
        )
        .neq('id', session.user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users (raw):', error);
        throw new Error(
          `Erreur Supabase: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})`
        );
      }
      setSearchResults(
        data.map((u) => ({
          ...u,
          username: u.username || u.id.substring(0, 8),
        }))
      );
    } catch (error) {
      console.error('Error searching users (processed):', error);
      toast({
        title: 'Erreur de recherche',
        description: error.message,
        variant: 'destructive',
      });
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const fetchPublicRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          id, name, description, image_url, servings, calories, tags, visibility, user_id,
          author:public_users (id, username, avatar_url)
        `
        )
        .eq('visibility', 'public')
        .neq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Error fetching public recipes (raw):', error);
        throw new Error(
          `Erreur Supabase: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})`
        );
      }

      const formattedRecipes = formatRecipes(data);
      setPublicRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error fetching public recipes (processed):', error);
      toast({
        title: 'Erreur',
        description:
          'Impossible de charger les recettes publiques: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingRecipes(false);
    }
  }, [toast, session]);

  useEffect(() => {
    if (activeSubTab === 'discover') {
      fetchPublicRecipes();
    }
  }, [fetchPublicRecipes, activeSubTab]);

  const handleSelectRecipe = (recipe) => {
    if (recipe.user_id === session?.user?.id) {
      navigate(`/app/recipes?open=${recipe.id}`);
    } else {
      navigate(`/app/profile/${recipe.user_id}?recipe=${recipe.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Compass className="w-4 h-4" /> Découvrir
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Amis
          </TabsTrigger>
          <TabsTrigger
            value="my-profile-preview"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Mon Profil Public
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <div className="space-y-8">
            <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
              >
                <Input
                  type="text"
                  placeholder="Rechercher par pseudo ou @identifiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full flex-grow"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loadingSearch}
                  className="w-full sm:w-auto"
                >
                  {loadingSearch ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 mr-2" />
                  )}
                  Rechercher
                </Button>
              </form>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
                <h2 className="text-xl font-semibold text-pastel-primary mb-4">
                  Résultats de la recherche :
                </h2>
                <ul className="space-y-3">
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={`Avatar de ${user.username}`}
                            className="w-10 h-10 rounded-full object-cover border border-pastel-border"
                          />
                        ) : (
                          <UserCircle className="w-10 h-10 text-pastel-muted-foreground" />
                        )}
                        <div>
                          <span className="font-medium text-pastel-text text-md">
                            {user.username}
                          </span>
                          {user.user_tag && (
                            <p className="text-xs text-pastel-muted-foreground font-mono">
                              @{user.user_tag}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/app/profile/${user.id}`}>
                          Voir le profil
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchTerm && !loadingSearch && searchResults.length === 0 && (
              <div className="text-center py-8 px-6 bg-pastel-card rounded-xl shadow-pastel-soft">
                <p className="text-lg text-pastel-muted-foreground">
                  Aucun utilisateur trouvé pour "{searchTerm}".
                </p>
              </div>
            )}

            <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
              <h2 className="text-xl sm:text-2xl font-bold text-pastel-secondary mb-6 text-center">
                Dernières Recettes Publiques
              </h2>
              {loadingRecipes ? (
                <LoadingScreen message="Chargement des recettes publiques..." />
              ) : publicRecipes.length > 0 ? (
                <RecipeList
                  recipes={publicRecipes}
                  onEdit={() =>
                    toast({
                      title: 'Non disponible',
                      description: 'Modification non permise ici.',
                      variant: 'default',
                    })
                  }
                  onDelete={() =>
                    toast({
                      title: 'Non disponible',
                      description: 'Suppression non permise ici.',
                      variant: 'default',
                    })
                  }
                  onSelectRecipe={handleSelectRecipe}
                />
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 mx-auto mb-3 text-pastel-border" />
                  <p className="text-lg text-pastel-muted-foreground">
                    Aucune recette publique à afficher pour le moment.
                  </p>
                  <p className="text-pastel-text/70">
                    Soyez le premier à partager une recette !
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="friends">
          {session && userProfile ? (
            <FriendsTab session={session} userProfile={userProfile} />
          ) : (
            <LoadingScreen message="Chargement des informations utilisateur..." />
          )}
        </TabsContent>

        <TabsContent value="my-profile-preview">
          {session && userProfile ? (
            <MyPublicProfile session={session} userProfile={userProfile} />
          ) : (
            <LoadingScreen message="Chargement de votre aperçu de profil..." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
