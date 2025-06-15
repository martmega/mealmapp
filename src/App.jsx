import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Auth from '@/components/Auth';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import Footer from '@/components/Footer';
import MainAppLayout from '@/components/layout/MainAppLayout';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { useRecipes } from '@/hooks/useRecipes.jsx';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';
import { useSession } from '@/hooks/useSession.js';
import { useUserProfile } from '@/hooks/useUserProfile.js';
import AppRoutes from '@/components/AppRoutes.jsx';

function App() {
  const { session, loading: sessionLoading, refreshSession, handleSignOut } =
    useSession();
  const { userProfile, loading: profileLoading, refreshProfile } =
    useUserProfile(session);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);
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

  const loadingInitialState = sessionLoading || profileLoading;

  const toggleDarkMode = () => setDarkMode((prevMode) => !prevMode);

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

  const openRecipeFormForAdd = () => {
    setEditingRecipe(null);
    setShowRecipeForm(true);
  };
  const closeRecipeForm = () => {
    setShowRecipeForm(false);
    setEditingRecipe(null);
  };

  const handleProfileUpdated = useCallback(async () => {
    await refreshSession();
    await refreshProfile();
  }, [refreshSession, refreshProfile]);

  if (loadingInitialState || session === undefined || userProfile === undefined) {
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
        <AppRoutes
          session={session}
          userProfile={userProfile}
          recipes={recipes}
          recipesLoading={recipesLoading}
          weeklyMenu={weeklyMenu}
          weeklyMenuLoading={weeklyMenuLoading}
          showRecipeForm={showRecipeForm}
          editingRecipe={editingRecipe}
          openRecipeFormForAdd={openRecipeFormForAdd}
          closeRecipeForm={closeRecipeForm}
          handleAddRecipeSubmit={handleAddRecipeSubmit}
          handleEditRecipeSubmit={handleEditRecipeSubmit}
          deleteRecipeHook={deleteRecipeHook}
          saveUserWeeklyMenuHook={saveUserWeeklyMenuHook}
          setEditingRecipe={setEditingRecipe}
          setSelectedRecipeForDetail={setSelectedRecipeForDetail}
          handleProfileUpdated={handleProfileUpdated}
        />
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
