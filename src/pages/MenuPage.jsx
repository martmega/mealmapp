import React, { useState, useEffect } from 'react';
import MenuPlanner from '@/components/MenuPlanner';
import MenuTabs from '@/components/MenuTabs.jsx';
import { getSupabase } from '@/lib/supabase';
import { createSharedMenu } from '@/lib/sharedMenu.js';
import { useFriendsList } from '@/hooks/useFriendsList.js';
import { useMenuParticipants } from '@/hooks/useMenuParticipants.js';
import { toDbPrefs } from '@/hooks/useWeeklyMenu.js';
import { DEFAULT_MENU_PREFS } from '@/lib/defaultPreferences.js';
import { initialWeeklyMenuState } from '@/lib/menu';
import ParticipantWeights from '@/components/ParticipantWeights.jsx';

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

  const participants = useMenuParticipants(isShared ? selectedMenuId : null);
  const [participantWeights, setParticipantWeights] = useState({});

  useEffect(() => {
    console.log('preferences:', preferences);
  }, [preferences]);

  useEffect(() => {
    if (participants.length > 0) {
      setParticipantWeights((prev) => {
        const count = participants.length;
        const defaultWeight = count > 0 ? 1 / count : 0;
        const updated = { ...prev };
        participants.forEach((p) => {
          if (typeof updated[p.id] !== 'number') {
            updated[p.id] = defaultWeight;
          }
        });
        return updated;
      });
    }
  }, [participants]);

  const handleWeightChange = (userId, weight) => {
    setParticipantWeights((prev) => ({ ...prev, [userId]: weight }));
  };

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
      const basePrefs = { ...DEFAULT_MENU_PREFS };
      if (!sharedFlag) basePrefs.commonMenuSettings = {};
      const dbPrefs = toDbPrefs(basePrefs);
      await supabase
        .from('weekly_menu_preferences')
        .insert({ menu_id: createdId, ...dbPrefs });
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
      {isShared && participants.length > 0 && (
        <ParticipantWeights
          participants={participants}
          weights={participantWeights}
          onWeightChange={handleWeightChange}
        />
      )}
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
