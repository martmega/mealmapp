import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import RecipeForm from '@/components/RecipeForm';
import RecipeList from '@/components/RecipeList';
import MenuPlanner from '@/components/MenuPlanner';
import ShoppingList from '@/components/ShoppingList';
import AccountPage from '@/components/AccountPage';
import Footer from '@/components/Footer';
import TermsAndConditions from '@/pages/legal/TermsAndConditions';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import ContactPage from '@/pages/legal/ContactPage';
import CommunityPage from '@/pages/CommunityPage';
import UserProfilePage from '@/pages/UserProfilePage';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import MainAppLayout from '@/components/layout/MainAppLayout';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { useRecipes } from '@/hooks/useRecipes.jsx';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';
import { useToast } from '@/components/ui/use-toast.js';
import { PlusCircle } from 'lucide-react';

function App() {
  const [session, setSession] = useState(undefined);
  const [userProfile, setUserProfile] = useState(undefined);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);
  const [loadingInitialState, setLoadingInitialState] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) {
      return window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? true
        : false;
    }
    return JSON.parse(savedMode);
  });

  const { toast } = useToast();
  const {
    recipes,
    addRecipe: addRecipeHook,
    updateRecipe: updateRecipeHook,
    deleteRecipe: deleteRecipeHook,
    loading: recipesLoading,
  } = useRecipes(session);

  const {
    weeklyMenu,
    setWeeklyMenu: saveUserWeeklyMenuHook,
    loading: weeklyMenuLoading,
  } = useWeeklyMenu(session);

  const location = useLocation();
  const routerNavigate = useRouterNavigate();

  useEffect(() => {
    const currentPathTab = location.pathname.split('/app/')[1]?.split('/')[0];
    const validTabs = ['recipes', 'menu', 'shopping', 'community', 'account'];
    if (validTabs.includes(currentPathTab)) {
      if (activeTab !== currentPathTab) {
        setActiveTab(currentPathTab);
      }
    } else if (
      location.pathname === '/app' ||
      location.pathname === '/app/' ||
      location.pathname === '/'
    ) {
      setActiveTab('recipes');
      if (location.pathname !== '/app/recipes')
        routerNavigate('/app/recipes', { replace: true });
    }
  }, [location.pathname, activeTab, routerNavigate]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prevMode) => !prevMode);

  const fetchUserProfile = useCallback(
    async (currentSession) => {
      const defaultProfileBase = {
        subscription_tier: 'non-authenticated',
        username: 'Visiteur',
        user_tag: '',
        email: '',
        avatar_url: null,
        bio: '',
        preferences: {
          servingsPerMeal: 4,
          maxCalories: 2200,
          meals: [],
          tagPreferences: [],
          commonMenuSettings: { enabled: false, linkedUsers: [] },
        },
      };

      if (currentSession === null || !currentSession?.user?.id) {
        setUserProfile({ id: null, ...defaultProfileBase });
        return { id: null, ...defaultProfileBase };
      }
      if (currentSession === undefined) {
        return undefined;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('public_users')
          .select('id, email, username, avatar_url, bio, user_tag')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn(
            'Warning fetching public_users profile:',
            profileError.message,
            profileError.details,
            profileError.hint
          );
        }

        const appMetadata = currentSession.user.app_metadata || {};
        const userMetadata = currentSession.user.user_metadata || {};

        let finalProfileData = {
          id: currentSession.user.id,
          email: profile?.email || currentSession.user.email,
          username:
            profile?.username ||
            userMetadata.username ||
            currentSession.user.email?.split('@')[0] ||
            'Utilisateur',
          user_tag:
            profile?.user_tag ||
            userMetadata.user_tag ||
            'user_' + currentSession.user.id.substring(0, 8),
          avatar_url: profile?.avatar_url || userMetadata.avatar_url || null,
          bio: profile?.bio || userMetadata.bio || '',
          subscription_tier:
            userMetadata.subscription_tier ||
            appMetadata.subscription_tier ||
            'standard',
        };

        const defaultPreferences = {
          servingsPerMeal: 4,
          maxCalories: 2200,
          meals: [],
          tagPreferences: [],
          commonMenuSettings: { enabled: false, linkedUsers: [] },
        };
        finalProfileData.preferences = {
          ...defaultPreferences,
          ...(userMetadata.preferences || {}),
        };
        finalProfileData.preferences.commonMenuSettings = {
          ...defaultPreferences.commonMenuSettings,
          ...(userMetadata.preferences?.commonMenuSettings || {}),
          linkedUsers: Array.isArray(
            userMetadata.preferences?.commonMenuSettings?.linkedUsers
          )
            ? userMetadata.preferences.commonMenuSettings.linkedUsers
            : [],
        };

        setUserProfile(finalProfileData);
        return finalProfileData;
      } catch (error) {
        console.error('Error processing user profile:', error);
        toast({
          title: 'Erreur Profil',
          description: 'Impossible de traiter les données du profil.',
          variant: 'destructive',
        });
        setUserProfile({
          id: currentSession.user.id,
          ...defaultProfileBase,
          email: currentSession.user.email,
          subscription_tier: 'standard',
          username: currentSession.user.email?.split('@')[0] || 'Utilisateur',
          user_tag: 'user_' + currentSession.user.id.substring(0, 8),
        });
        return {
          id: currentSession.user.id,
          ...defaultProfileBase,
          user_tag: 'user_' + currentSession.user.id.substring(0, 8),
        };
      }
    },
    [toast]
  );

  useEffect(() => {
    setLoadingInitialState(true);
    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        await fetchUserProfile(currentSession);
        setLoadingInitialState(false);
      })
      .catch(async (error) => {
        console.error('Error in initial getSession:', error);
        setSession(null);
        await fetchUserProfile(null);
        setLoadingInitialState(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setLoadingInitialState(true);
      setSession(newSession);
      await fetchUserProfile(newSession);
      setLoadingInitialState(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  const handleAddRecipeSubmit = async (recipeData) => {
    const success = await addRecipeHook(recipeData);
    if (success) setShowRecipeForm(false);
    return success;
  };

  const handleEditRecipeSubmit = async (recipeData) => {
    if (!editingRecipe) return false;
    const success = await updateRecipeHook(editingRecipe.id, recipeData);
    if (success) {
      setShowRecipeForm(false);
      setEditingRecipe(null);
    }
    return success;
  };

  const handleSignOut = async () => {
    setLoadingInitialState(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: 'Déconnexion réussie',
        description: 'Vous avez été déconnecté.',
      });
      routerNavigate('/app/recipes', { replace: true });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter.',
        variant: 'destructive',
      });
    } finally {
      setSession(null);
      setUserProfile(null);
      setLoadingInitialState(false);
    }
  };

  const openRecipeFormForAdd = () => {
    setEditingRecipe(null);
    setShowRecipeForm(true);
  };
  const closeRecipeForm = () => {
    setShowRecipeForm(false);
    setEditingRecipe(null);
  };

  const handleProfileUpdated = useCallback(async () => {
    setLoadingInitialState(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      const updatedProfile = await fetchUserProfile(currentSession);
      if (updatedProfile) setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error on handleProfileUpdated (fetchUserProfile):', error);
    } finally {
      setLoadingInitialState(false);
    }
  }, [fetchUserProfile]);

  const recipePageTitle = useMemo(() => {
    if (
      userProfile &&
      userProfile.username &&
      userProfile.username !== 'Visiteur'
    ) {
      return `Recettes de ${userProfile.username}`;
    }
    return 'Mes Recettes';
  }, [userProfile]);

  const isMenuDataEmpty = (menu) => {
    if (!menu || !Array.isArray(menu)) return true;
    return !menu.some(
      (dayMeals) =>
        Array.isArray(dayMeals) &&
        dayMeals.some(
          (mealRecipes) => Array.isArray(mealRecipes) && mealRecipes.length > 0
        )
    );
  };

  if (
    loadingInitialState ||
    session === undefined ||
    userProfile === undefined
  ) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`min-h-screen text-pastel-text bg-pastel-background transition-colors duration-300 ${darkMode ? 'dark' : ''} flex flex-col`}
    >
      <MainAppLayout
        session={session}
        userProfile={userProfile}
        activeTab={activeTab}
        setActiveTabInternal={setActiveTab}
        handleSignOut={handleSignOut}
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        toggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
      >
        <Routes>
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route
            path="/app/recipes"
            element={
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
                  <h2 className="text-2xl sm:text-3xl font-bold text-pastel-primary">
                    {recipePageTitle}
                  </h2>
                  <button
                    onClick={openRecipeFormForAdd}
                    className="bg-pastel-secondary text-pastel-secondary-text hover:bg-pastel-secondary-hover px-4 py-2 rounded-md shadow-pastel-button hover:shadow-pastel-button-hover flex items-center"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Ajouter une Recette
                  </button>
                </div>
                {recipesLoading ? (
                  <LoadingScreen message="Chargement des recettes..." />
                ) : (
                  <RecipeList
                    recipes={recipes}
                    onEdit={(recipe) => {
                      setEditingRecipe(recipe);
                      setShowRecipeForm(true);
                    }}
                    onDelete={deleteRecipeHook}
                    onSelectRecipe={setSelectedRecipeForDetail}
                  />
                )}
                {showRecipeForm && (
                  <RecipeForm
                    recipe={editingRecipe}
                    onSubmit={
                      editingRecipe
                        ? handleEditRecipeSubmit
                        : handleAddRecipeSubmit
                    }
                    onClose={closeRecipeForm}
                    session={session}
                    userProfile={userProfile}
                  />
                )}
              </div>
            }
          />
          <Route
            path="/app/menu"
            element={
              session &&
              (recipesLoading || weeklyMenuLoading) &&
              isMenuDataEmpty(weeklyMenu) ? (
                <LoadingScreen message="Chargement du menu..." />
              ) : session ? (
                <MenuPlanner
                  recipes={recipes}
                  weeklyMenu={weeklyMenu}
                  setWeeklyMenu={saveUserWeeklyMenuHook}
                  userProfile={userProfile}
                />
              ) : (
                <Navigate to="/app/recipes" replace />
              )
            }
          />
          <Route
            path="/app/shopping"
            element={
              (recipesLoading || weeklyMenuLoading) &&
              isMenuDataEmpty(weeklyMenu) ? (
                <LoadingScreen message="Chargement de la liste de courses..." />
              ) : (
                <ShoppingList
                  weeklyMenu={weeklyMenu}
                  recipes={recipes}
                  userProfile={userProfile}
                />
              )
            }
          />
          <Route
            path="/app/community"
            element={
              session ? (
                <CommunityPage session={session} userProfile={userProfile} />
              ) : (
                <Navigate to="/app/recipes" replace />
              )
            }
          />
          <Route
            path="/app/profile/:userId"
            element={
              <UserProfilePage
                session={session}
                currentUserProfile={userProfile}
              />
            }
          />
          <Route
            path="/app/account"
            element={
              session &&
              (recipesLoading || weeklyMenuLoading) &&
              isMenuDataEmpty(weeklyMenu) ? (
                <LoadingScreen message="Chargement du compte..." />
              ) : session ? (
                <AccountPage
                  session={session}
                  userProfile={userProfile}
                  onProfileUpdate={handleProfileUpdated}
                />
              ) : (
                <Navigate to="/app/recipes" replace />
              )
            }
          />
          <Route
            path="/app/*"
            element={<Navigate to="/app/recipes" replace />}
          />
          <Route path="/" element={<Navigate to="/app/recipes" replace />} />
        </Routes>
      </MainAppLayout>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      {selectedRecipeForDetail && (
        <RecipeDetailModal
          recipe={selectedRecipeForDetail}
          onClose={() => setSelectedRecipeForDetail(null)}
          userProfile={userProfile}
        />
      )}

      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
