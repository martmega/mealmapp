
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Settings, RotateCw } from "lucide-react";
import MenuPreferencesPanel from "@/components/menu_planner/MenuPreferencesPanel.jsx";
import ReplaceRecipeModal from "@/components/menu_planner/ReplaceRecipeModal.jsx";
import DailyMenu from "@/components/DailyMenu";
import { useMenuGeneration } from "@/components/MenuPlannerLogic.js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const initialWeeklyMenuState = () => Array(7).fill(null).map(() => []);

function MenuPlanner({ recipes = [], weeklyMenu: propWeeklyMenu, setWeeklyMenu, userProfile }) {
  const { toast } = useToast();
  const [internalWeeklyMenu, setInternalWeeklyMenu] = useState(
    Array.isArray(propWeeklyMenu) && propWeeklyMenu.length === 7 ? propWeeklyMenu : initialWeeklyMenuState()
  );
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  
  useEffect(() => {
    setInternalWeeklyMenu(
      Array.isArray(propWeeklyMenu) && propWeeklyMenu.length === 7 ? propWeeklyMenu : initialWeeklyMenuState()
    );
  }, [propWeeklyMenu]);

  const handleSetWeeklyMenu = (newMenu) => {
    const validatedMenu = Array.isArray(newMenu) && newMenu.length === 7 
      ? newMenu.map(day => Array.isArray(day) ? day.map(meal => Array.isArray(meal) ? meal : []) : []) 
      : initialWeeklyMenuState();
    setInternalWeeklyMenu(validatedMenu);
    setWeeklyMenu(validatedMenu); 
  };

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("menuPreferences");
    const defaultPreferences = {
      meals: [
        { id: 1, types: ["petit-dejeuner"], enabled: true, mealNumber: 1 },
        { id: 2, types: ["plat"], enabled: true, mealNumber: 2 },
        { id: 3, types: ["encas-sucre", "encas-sale"], enabled: true, mealNumber: 3 }
      ],
      maxCalories: 2200,
      tagPreferences: [],
      servingsPerMeal: 4,
      commonMenuSettings: {
        enabled: false,
        linkedUsers: [], 
        linkedUserRecipes: [],
      }
    };
    
    let initialPrefs = saved ? JSON.parse(saved) : defaultPreferences;
    if (userProfile?.preferences) {
      initialPrefs = {
        ...initialPrefs,
        servingsPerMeal: userProfile.preferences.servingsPerMeal || initialPrefs.servingsPerMeal || 4,
        maxCalories: userProfile.preferences.maxCalories || initialPrefs.maxCalories || 2200,
        meals: userProfile.preferences.meals?.length ? userProfile.preferences.meals : initialPrefs.meals,
        tagPreferences: userProfile.preferences.tagPreferences?.length ? userProfile.preferences.tagPreferences : initialPrefs.tagPreferences,
        commonMenuSettings: {
            ...defaultPreferences.commonMenuSettings,
            ...(userProfile.preferences.commonMenuSettings || {}),
            linkedUsers: userProfile.preferences.commonMenuSettings?.linkedUsers || [],
            linkedUserRecipes: [], 
        }
      };
    }
    return initialPrefs;
  });

  const [isReplaceRecipeModalOpen, setIsReplaceRecipeModalOpen] = useState(false);
  const [recipeToReplaceInfo, setRecipeToReplaceInfo] = useState(null); 
  const [searchTermModal, setSearchTermModal] = useState("");
  const [newLinkedUserEmail, setNewLinkedUserEmail] = useState("");
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  useEffect(() => {
    localStorage.setItem("menuPreferences", JSON.stringify(preferences));
  }, [preferences]);

  const safeRecipes = useMemo(() => Array.isArray(recipes) ? recipes : [], [recipes]);

  const availableTags = useMemo(() => 
    [...new Set(safeRecipes.flatMap(recipe => Array.isArray(recipe.tags) ? recipe.tags : []))]
  , [safeRecipes]);
  
  const { generateMenu, isGenerating } = useMenuGeneration(safeRecipes, preferences, handleSetWeeklyMenu, userProfile);

  const handleGenerateMenu = useCallback(() => {
    generateMenu();
  }, [generateMenu]);

  const handlePlannedServingsChange = (dayIndex, mealIndex, recipeIndex, newServings) => {
    const updatedMenu = internalWeeklyMenu.map(day => day.map(meal => [...meal])); 
    if (updatedMenu[dayIndex]?.[mealIndex]?.[recipeIndex]) {
      updatedMenu[dayIndex][mealIndex][recipeIndex] = {
        ...updatedMenu[dayIndex][mealIndex][recipeIndex],
        plannedServings: parseInt(newServings, 10) || 1,
      };
      handleSetWeeklyMenu(updatedMenu);
    }
  };

  const openReplaceRecipeModal = (dayIndex, mealIndex, recipeIndex) => {
    setRecipeToReplaceInfo({ dayIndex, mealIndex, recipeIndex });
    setIsReplaceRecipeModalOpen(true);
    setSearchTermModal("");
  };

  const handleSelectRecipeForReplacement = (newRecipe) => {
    if (!recipeToReplaceInfo) return;
    const { dayIndex, mealIndex, recipeIndex } = recipeToReplaceInfo;
    const updatedMenu = internalWeeklyMenu.map(day => day.map(meal => [...meal])); 
    
    const defaultPlannedServings = userProfile?.preferences?.servingsPerMeal || preferences.servingsPerMeal || 4;

    if (updatedMenu[dayIndex]?.[mealIndex]) {
        updatedMenu[dayIndex][mealIndex][recipeIndex] = {
        ...newRecipe,
        mealNumber: updatedMenu[dayIndex][mealIndex][recipeIndex]?.mealNumber || preferences.meals.find(m => m.mealNumber === (mealIndex + 1))?.mealNumber || mealIndex + 1,
        plannedServings: defaultPlannedServings,
      };
      handleSetWeeklyMenu(updatedMenu);
    }
    setIsReplaceRecipeModalOpen(false);
    setRecipeToReplaceInfo(null);
  };
  
  const handleDeleteRecipeFromMeal = (dayIndex, mealIndex, recipeIndex) => {
    const updatedMenu = internalWeeklyMenu.map(day => day.map(meal => [...meal])); 
    if (updatedMenu[dayIndex]?.[mealIndex]) {
      updatedMenu[dayIndex][mealIndex].splice(recipeIndex, 1);
      handleSetWeeklyMenu(updatedMenu);
    }
  };

  const filteredRecipesForModal = useMemo(() => {
    if (!recipeToReplaceInfo) return [];
    
    const { mealIndex } = recipeToReplaceInfo;
    const mealPreference = preferences.meals.find(m => m.mealNumber === (mealIndex + 1)); 
    const allowedMealTypes = Array.isArray(mealPreference?.types) ? mealPreference.types : [];

    let recipesToFilter = [...safeRecipes];
    if (preferences.commonMenuSettings.enabled && Array.isArray(preferences.commonMenuSettings.linkedUserRecipes) && preferences.commonMenuSettings.linkedUserRecipes.length > 0) {
        recipesToFilter = [...recipesToFilter, ...preferences.commonMenuSettings.linkedUserRecipes];
    }
    
    const uniqueRecipeMap = new Map();
    recipesToFilter.forEach(r => {
      if (r && r.id) { 
        uniqueRecipeMap.set(r.id, r);
      }
    });
    const uniqueRecipes = Array.from(uniqueRecipeMap.values());

    return uniqueRecipes.filter(recipe => {
      if (!recipe || !recipe.name) return false;
      const nameMatch = recipe.name.toLowerCase().includes(searchTermModal.toLowerCase());
      const recipeMealTypes = Array.isArray(recipe.meal_types) ? recipe.meal_types : [];
      const typeMatch = allowedMealTypes.length === 0 || recipeMealTypes.some(rt => allowedMealTypes.includes(rt));
      return nameMatch && typeMatch;
    });
  }, [safeRecipes, recipeToReplaceInfo, searchTermModal, preferences.meals, preferences.commonMenuSettings]);

  const fetchLinkedUserRecipes = useCallback(async (userId, userName) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, author:public_users(id, username, avatar_url, user_tag)') 
        .eq('user_id', userId)
        .or('visibility.eq.public,visibility.eq.friends_only'); 

      if (error) throw error;
      return Array.isArray(data) ? data.map(r => ({ ...r, user: r.author, author: r.author?.username || r.author?.user_tag || 'Ami', sourceUserId: userId })) : [];
    } catch (error) {
      console.error(`Error fetching recipes for user ${userName} (${userId}):`, error);
      toast({ title: "Erreur", description: `Impossible de charger les recettes de ${userName}.`, variant: "destructive" });
      return [];
    }
  }, [toast]);

  const handleToggleCommonMenu = async () => {
    const newEnabledState = !preferences.commonMenuSettings.enabled;
    let newLinkedUsers = preferences.commonMenuSettings.linkedUsers || [];
    let newLinkedUserRecipes = [];

    if (newEnabledState && newLinkedUsers.length === 0 && userProfile?.id) {
      newLinkedUsers = [{ id: userProfile.id, name: userProfile.username || 'Moi', ratio: 100, isOwner: true }];
    }
    
    if (newEnabledState && newLinkedUsers.length > 0) {
        for (const user of newLinkedUsers) {
            if (user?.id && user.id !== userProfile?.id) { 
                const fetchedRecipes = await fetchLinkedUserRecipes(user.id, user.name);
                newLinkedUserRecipes.push(...fetchedRecipes);
            }
        }
    }

    setPreferences(prev => ({
      ...prev,
      commonMenuSettings: {
        ...prev.commonMenuSettings,
        enabled: newEnabledState,
        linkedUsers: newLinkedUsers,
        linkedUserRecipes: newLinkedUserRecipes,
      }
    }));
  };

  const handleLinkedUserRatioChange = (index, newRatioStr) => {
    const newRatio = parseInt(newRatioStr, 10);
    if (isNaN(newRatio)) return;

    const updatedUsers = [...(preferences.commonMenuSettings.linkedUsers || [])];
    if(updatedUsers[index]) {
      updatedUsers[index].ratio = Math.max(0, Math.min(100, newRatio));
    }
    
    setPreferences(prev => ({
      ...prev,
      commonMenuSettings: {
        ...prev.commonMenuSettings,
        linkedUsers: updatedUsers
      }
    }));
  };

  const handleAddLinkedUser = async () => {
    if (!newLinkedUserEmail.trim() || !userProfile?.id) {
      toast({ title: "Email requis", description: "Veuillez entrer l'email de l'utilisateur à lier.", variant: "destructive" });
      return;
    }
    if (newLinkedUserEmail.trim().toLowerCase() === userProfile.email?.toLowerCase()) {
      toast({ title: "Erreur", description: "Vous ne pouvez pas vous lier à vous-même.", variant: "destructive" });
      return;
    }
    setIsLinkingUser(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('public_users')
        .select('id, username, user_tag')
        .eq('email', newLinkedUserEmail.trim().toLowerCase())
        .single();
      
      if (usersError) throw usersError;
      if (!usersData) throw new Error("Utilisateur introuvable.");
      
      const peerUser = usersData;
      
      const currentLinkedUsers = preferences.commonMenuSettings.linkedUsers || [];
      if (currentLinkedUsers.some(u => u.id === peerUser.id)) {
        toast({ title: "Déjà lié", description: "Cet utilisateur est déjà dans votre liste.", variant: "default" });
        setIsLinkingUser(false);
        setNewLinkedUserEmail("");
        return;
      }

      const { error: linkError } = await supabase
        .from('user_relationships')
        .upsert({ 
          requester_id: userProfile.id, 
          addressee_id: peerUser.id, 
          status: 'accepted' 
        }, { onConflict: 'requester_id, addressee_id' });


      if (linkError && linkError.code !== '23505') {
        console.warn("Error creating/upserting relationship for menu link:", linkError)
      }

      const peerUsername = peerUser.username || peerUser.user_tag || peerUser.id.substring(0,8);
      const newLinkedUserEntry = { id: peerUser.id, name: peerUsername, ratio: 0, isOwner: false };
      
      const fetchedRecipes = await fetchLinkedUserRecipes(peerUser.id, peerUsername);
      const currentLinkedUserRecipes = preferences.commonMenuSettings.linkedUserRecipes || [];

      setPreferences(prev => ({
        ...prev,
        commonMenuSettings: {
          ...prev.commonMenuSettings,
          linkedUsers: [...currentLinkedUsers, newLinkedUserEntry],
          linkedUserRecipes: [...currentLinkedUserRecipes, ...fetchedRecipes],
        }
      }));
      toast({ title: "Utilisateur lié", description: `${peerUsername} a été ajouté à votre menu commun.` });
      setNewLinkedUserEmail("");

    } catch (error) {
      console.error("Error linking user:", error);
      toast({ title: "Erreur de liaison", description: error.message, variant: "destructive" });
    } finally {
      setIsLinkingUser(false);
    }
  };
  
  const handleRemoveLinkedUser = async (userIdToRemove) => {
    if (!userProfile?.id || !userIdToRemove) return;
    try {
        setPreferences(prev => ({
            ...prev,
            commonMenuSettings: {
                ...prev.commonMenuSettings,
                linkedUsers: (prev.commonMenuSettings.linkedUsers || []).filter(u => u.id !== userIdToRemove),
                linkedUserRecipes: (prev.commonMenuSettings.linkedUserRecipes || []).filter(r => r.sourceUserId !== userIdToRemove),
            }
        }));
        toast({ title: "Lien supprimé", description: "L'utilisateur a été retiré du menu commun." });
    } catch (error) {
        console.error("Error unlinking user:", error);
        toast({ title: "Erreur", description: "Impossible de supprimer le lien: " + error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchInitialLinks = async () => {
        if (!userProfile?.id || !preferences.commonMenuSettings.enabled) return;

        try {
            const { data: friendsData, error: friendsError } = await supabase
              .from('user_relationships')
              .select('requester_id, addressee_id, requester:public_users!user_relationships_requester_id_fkey(id, username, user_tag), addressee:public_users!user_relationships_addressee_id_fkey(id, username, user_tag)')
              .eq('status', 'accepted')
              .or(`requester_id.eq.${userProfile.id},addressee_id.eq.${userProfile.id}`);

            if (friendsError) throw friendsError;
            
            const linkedUserDetails = friendsData.map(rel => {
                const friendProfile = rel.requester_id === userProfile.id ? rel.addressee : rel.requester;
                if (!friendProfile) return null;
                return { 
                    id: friendProfile.id, 
                    name: friendProfile.username || friendProfile.user_tag || friendProfile.id.substring(0,8), 
                    ratio: 0, 
                    isOwner: false 
                };
            }).filter(Boolean);
            
            const validLinkedUsers = linkedUserDetails.filter(u => u && u.id);
            const ownerUserEntry = { id: userProfile.id, name: userProfile.username || 'Moi', ratio: validLinkedUsers.length > 0 ? 50 : 100, isOwner: true };
            
            if (validLinkedUsers.length > 0) {
                const remainingRatio = 100 - ownerUserEntry.ratio;
                const ratioPerUser = Math.floor(remainingRatio / validLinkedUsers.length);
                validLinkedUsers.forEach(u => { if (u) u.ratio = ratioPerUser });
                const remainder = remainingRatio % validLinkedUsers.length;
                if (remainder > 0 && validLinkedUsers[0]) validLinkedUsers[0].ratio += remainder;
            }

            const allLinkedUsersSetup = [ownerUserEntry, ...validLinkedUsers];
            let allLinkedUserRecipes = [];

            for (const user of allLinkedUsersSetup) {
                if (user?.id && user.id !== userProfile.id) {
                    const fetchedRecipes = await fetchLinkedUserRecipes(user.id, user.name);
                    allLinkedUserRecipes.push(...fetchedRecipes);
                }
            }
            
            setPreferences(prev => ({
                ...prev,
                commonMenuSettings: {
                    ...prev.commonMenuSettings,
                    linkedUsers: allLinkedUsersSetup.filter(u => u && u.id), 
                    linkedUserRecipes: allLinkedUserRecipes.filter(r => r && r.id), 
                }
            }));

        } catch (error) {
            console.error("Error fetching initial user links:", error);
        }
    };

    if (preferences.commonMenuSettings.enabled) {
        fetchInitialLinks();
    }
  }, [userProfile?.id, userProfile?.username, preferences.commonMenuSettings.enabled, fetchLinkedUserRecipes, supabase]);


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 section-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-pastel-primary">Menu de la semaine</h2>
        <div className="flex flex-wrap gap-3">
          <Dialog open={isPreferencesModalOpen} onOpenChange={setIsPreferencesModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="shadow-pastel-button hover:shadow-pastel-button-hover"
              >
                <Settings className="w-4 h-4 mr-2" />
                Préférences
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl modal-content-custom">
              <DialogHeader>
                <DialogTitle>Préférences du Menu</DialogTitle>
                <DialogDescription>
                  Configurez vos préférences pour la génération automatique du menu.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] p-1">
                <MenuPreferencesPanel
                  preferences={preferences}
                  setPreferences={setPreferences}
                  availableTags={availableTags}
                  newLinkedUserEmail={newLinkedUserEmail}
                  setNewLinkedUserEmail={setNewLinkedUserEmail}
                  isLinkingUser={isLinkingUser}
                  handleAddLinkedUser={handleAddLinkedUser}
                  handleToggleCommonMenu={handleToggleCommonMenu}
                  handleLinkedUserRatioChange={handleLinkedUserRatioChange}
                  handleRemoveLinkedUser={handleRemoveLinkedUser}
                />
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Fermer</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleGenerateMenu} disabled={isGenerating} variant="secondary" className="min-w-[200px]">
            <RotateCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? "Génération en cours..." : "Générer un nouveau menu"}
          </Button>
        </div>
      </div>

      <div className="menu-grid">
        {DAYS.map((day, dayIdx) => (
          <DailyMenu
            key={day}
            day={day}
            dayIndex={dayIdx}
            menuForDay={(Array.isArray(internalWeeklyMenu) && internalWeeklyMenu[dayIdx]) ? internalWeeklyMenu[dayIdx] : []}
            userProfile={userProfile}
            onPlannedServingsChange={(mealIdx, recipeIdx, newServings) => handlePlannedServingsChange(dayIdx, mealIdx, recipeIdx, newServings)}
            onReplaceRecipe={(mealIdx, recipeIdx) => openReplaceRecipeModal(dayIdx, mealIdx, recipeIdx)}
            onDeleteRecipe={(mealIdx, recipeIdx) => handleDeleteRecipeFromMeal(dayIdx, mealIdx, recipeIdx)}
          />
        ))}
      </div>

      <ReplaceRecipeModal
        isOpen={isReplaceRecipeModalOpen}
        onOpenChange={setIsReplaceRecipeModalOpen}
        searchTerm={searchTermModal}
        onSearchTermChange={setSearchTermModal}
        filteredRecipes={filteredRecipesForModal}
        onSelectRecipe={handleSelectRecipeForReplacement}
        userProfile={userProfile}
      />

    </div>
  );
}

export default MenuPlanner;

