import React, { useState, useEffect, useCallback } from 'react';
import {
  useLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Auth from '@/components/Auth';
import RecipeDetailModal from '@/components/RecipeDetailModal';
import Footer from '@/components/Footer';
import MainAppLayout from '@/components/layout/MainAppLayout';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { useRecipes } from '@/hooks/useRecipes.jsx';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';
import { useMenus } from '@/hooks/useMenus.js';
import { useSession } from '@/hooks/useSession.js';
import { useUserProfile } from '@/hooks/useUserProfile.js';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests.js';
import AppRoutes from '@/components/AppRoutes.jsx';

function App() {
  const {
    session,
    loading: sessionLoading,
    refreshSession,
    handleSignOut,
  } = useSession();
  const {
    userProfile,
    loading: profileLoading,
    refreshProfile,
  } = useUserProfile(session);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode =
      savedMode === null
        ? window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        : JSON.parse(savedMode);
    if (initialMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return initialMode;
  });

  const {
    recipes,
    addRecipe: addRecipeHook,
    updateRecipe: updateRecipeHook,
    deleteRecipe: deleteRecipeHook,
    loading: recipesLoading,
  } = useRecipes(session, userProfile?.subscription_tier);

  const {
    menus,
    loading: menusLoading,
    selectedMenuId,
    setSelectedMenuId,
    refreshMenus,
  } = useMenus(session);

  const {
    weeklyMenu,
    menuName,
    isShared,
    setWeeklyMenu: saveUserWeeklyMenuHook,
    updateMenuName,
    deleteMenu: deleteWeeklyMenu,
    loading: weeklyMenuLoading,
  } = useWeeklyMenu(session, selectedMenuId);

  const { pendingCount, refreshPendingFriendRequests } =
    usePendingFriendRequests(session);

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

  const openRecipeForm = () => {
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

  if (
    loadingInitialState ||
    session === undefined ||
    userProfile === undefined
  ) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#121212] dark:text-white transition-colors duration-300 flex flex-col">
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
        pendingRequestCount={pendingCount}
      >
        <AppRoutes
          session={session}
          userProfile={userProfile}
          recipes={recipes}
          recipesLoading={recipesLoading}
          menus={menus}
          menusLoading={menusLoading}
          selectedMenuId={selectedMenuId}
          setSelectedMenuId={setSelectedMenuId}
          refreshMenus={refreshMenus}
          weeklyMenu={weeklyMenu}
          weeklyMenuLoading={weeklyMenuLoading}
          menuName={menuName}
          isShared={isShared}
          saveUserWeeklyMenuHook={saveUserWeeklyMenuHook}
          updateMenuName={updateMenuName}
          deleteWeeklyMenu={deleteWeeklyMenu}
          showRecipeForm={showRecipeForm}
          editingRecipe={editingRecipe}
          openRecipeFormForAdd={openRecipeForm}
          closeRecipeForm={closeRecipeForm}
          handleAddRecipeSubmit={handleAddRecipeSubmit}
          handleEditRecipeSubmit={handleEditRecipeSubmit}
          deleteRecipeHook={deleteRecipeHook}
          setEditingRecipe={setEditingRecipe}
          setSelectedRecipeForDetail={setSelectedRecipeForDetail}
          handleProfileUpdated={handleProfileUpdated}
          refreshPendingFriendRequests={refreshPendingFriendRequests}
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
