import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TermsAndConditions from '@/pages/legal/TermsAndConditions';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import ContactPage from '@/pages/legal/ContactPage';
import RecipeForm from '@/components/RecipeForm';
import RecipeList from '@/components/RecipeList';
import MenuPlanner from '@/components/MenuPlanner';
import ShoppingList from '@/components/ShoppingList';
import AccountPage from '@/components/AccountPage';
import CommunityPage from '@/pages/CommunityPage';
import UserProfilePage from '@/pages/UserProfilePage';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { PlusCircle } from 'lucide-react';
import LoginPage from '@/pages/Login.jsx';

export default function AppRoutes({
  session,
  userProfile,
  recipes,
  recipesLoading,
  weeklyMenu,
  weeklyMenuLoading,
  showRecipeForm,
  editingRecipe,
  openRecipeFormForAdd,
  closeRecipeForm,
  handleAddRecipeSubmit,
  handleEditRecipeSubmit,
  deleteRecipeHook,
  saveUserWeeklyMenuHook,
  setEditingRecipe,
  setSelectedRecipeForDetail,
  handleProfileUpdated,
}) {
  const recipePageTitle = useMemo(() => {
    if (userProfile && userProfile.username && userProfile.username !== 'Visiteur') {
      return `Recettes de ${userProfile.username}`;
    }
    return 'Mes Recettes';
  }, [userProfile]);

  const isMenuDataEmpty = (menu) => {
    if (!menu || !Array.isArray(menu)) return true;
    return !menu.some(
      (dayMeals) =>
        Array.isArray(dayMeals) &&
        dayMeals.some((mealRecipes) => Array.isArray(mealRecipes) && mealRecipes.length > 0)
    );
  };

  return (
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
                  openRecipeFormForAdd();
                }}
                onDelete={deleteRecipeHook}
                onSelectRecipe={setSelectedRecipeForDetail}
              />
            )}
            {showRecipeForm && (
              <RecipeForm
                recipe={editingRecipe}
                onSubmit={editingRecipe ? handleEditRecipeSubmit : handleAddRecipeSubmit}
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
            <ShoppingList weeklyMenu={weeklyMenu} recipes={recipes} userProfile={userProfile} />
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
        element={<UserProfilePage session={session} currentUserProfile={userProfile} />}
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
      <Route path="/app/*" element={<Navigate to="/app/recipes" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/app/recipes" replace />} />
    </Routes>
  );
}
