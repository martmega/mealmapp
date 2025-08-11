import React, { useState } from 'react';
import MenuPlanner from '@/components/MenuPlanner';
import MenuTabs from '@/components/MenuTabs.jsx';
import { getSupabase } from '@/lib/supabase';
import { createSharedMenu } from '@/lib/sharedMenu.js';
import { useFriendsList } from '@/hooks/useFriendsList.js';
import { initialWeeklyMenuState } from '@/lib/menu';

const supabase = getSupabase();

export default function MenuPage({
  session,
  userProfile,
  recipes,
  menus = [],
  selectedMenuId,
  setSelectedMenuId,
  refreshMenus,
  weeklyMenu,
  menuName,
  isShared,
  preferences,
  updatePreferences,
  setWeeklyMenu,
  updateMenuName,
  deleteMenu,
}) {
  if (!preferences) {
    return <div>Chargement des préférences...</div>;
  }

  const friends = useFriendsList(session);

  const handleRename = async (id, name) => {
    await updateMenuName(name, id);
    refreshMenus();
  };

  const handleDelete = async (id) => {
    await deleteMenu(id);
    refreshMenus();
    if (id === selectedMenuId) {
      const remaining = menus.filter((m) => m.id !== id);
      setSelectedMenuId(remaining[0]?.id || null);
    }
  };

  const handleCreate = async ({ name, participantIds = [], isShared: sharedFlag } = {}) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const cleanedIds = Array.isArray(participantIds)
      ? [...new Set(participantIds.filter((id) => id && id !== userId))]
      : [];

    const menuName = name || 'Menu sans titre';

    let createdId = null;

    if (sharedFlag) {
      const result = await createSharedMenu({
        user_id: userId,
        name: menuName,
        menu_data: initialWeeklyMenuState(),
        participant_ids: cleanedIds,
      });
      if (!result?.id) return;
      createdId = result.id;
    } else {
      const insertData = {
        user_id: userId,
        name: menuName,
        is_shared: false,
        menu_data: initialWeeklyMenuState(),
      };
      const { data, error } = await supabase
        .from('weekly_menus')
        .insert(insertData)
        .select('id')
        .single();
      if (error) {
        console.error('Erreur creation menu:', error);
        return;
      }
      createdId = data?.id || null;
    }

    if (createdId) {
      await refreshMenus();
      setSelectedMenuId(createdId);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <MenuTabs
        menus={menus}
        activeMenuId={selectedMenuId}
        onSelect={setSelectedMenuId}
        currentUserId={session?.user?.id}
        onDelete={handleDelete}
        onCreate={handleCreate}
        friends={friends}
      />
      <MenuPlanner
        recipes={recipes}
        weeklyMenu={weeklyMenu}
        setWeeklyMenu={setWeeklyMenu}
        userProfile={userProfile}
        menuName={menuName}
        preferences={preferences}
        updatePreferences={updatePreferences}
        isShared={isShared}
        onUpdateMenuName={(name) => handleRename(selectedMenuId, name)}
        onDeleteMenu={() => handleDelete(selectedMenuId)}
      />
    </div>
  );
}
