import React from 'react';
import MenuPlanner from '@/components/MenuPlanner';
import MenuTabs from '@/components/MenuTabs.jsx';
import { getSupabase } from '@/lib/supabase';
import { initialWeeklyMenuState } from '@/lib/menu';
import { useMenus } from '@/hooks/useMenus.js';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';
import { useFriendsList } from '@/hooks/useFriendsList.js';
import { useMenuParticipants } from '@/hooks/useMenuParticipants.js';
import SignedImage from '@/components/SignedImage';
import { DEFAULT_AVATAR_URL } from '@/lib/images';

const supabase = getSupabase();

export default function MenuPage({ session, userProfile, recipes }) {
  const { menus, selectedMenuId, setSelectedMenuId, refreshMenus } =
    useMenus(session);

  const friends = useFriendsList(session);

  const {
    weeklyMenu,
    menuName,
    isShared,
    setWeeklyMenu,
    updateMenuName,
    deleteMenu,
  } = useWeeklyMenu(session, selectedMenuId);

  const participants = useMenuParticipants(isShared ? selectedMenuId : null);

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

  const handleCreate = async ({ name, isShared, participantIds } = {}) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const insertData = {
      user_id: userId,
      name: name || 'Menu sans titre',
      menu_data: initialWeeklyMenuState(),
    };
    // Add is_shared flag if column exists
    insertData.is_shared = isShared;

    const { data, error } = await supabase
      .from('weekly_menus')
      .insert(insertData)
      .select('id')
      .single();
    if (error) {
      console.error('Erreur creation menu:', error);
      return;
    }

    if (isShared && Array.isArray(participantIds)) {
      const rows = participantIds.map((userId) => ({
        menu_id: data.id,
        user_id: userId,
      }));
      await supabase.from('menu_participants').insert(rows);
    }

    await refreshMenus();
    if (data?.id) setSelectedMenuId(data.id);
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
        <div className="bg-pastel-card p-4 rounded-lg shadow-pastel-soft flex flex-wrap items-center gap-3">
          <span className="font-semibold text-pastel-text">Participants :</span>
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              {p.avatar_url ? (
                <SignedImage
                  bucket="avatars"
                  path={p.avatar_url}
                  alt={p.username}
                  fallback={DEFAULT_AVATAR_URL}
                  className="w-8 h-8 rounded-full object-cover border border-pastel-border"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-pastel-muted flex items-center justify-center text-xs text-pastel-muted-foreground">
                  {p.username?.charAt(0) || 'U'}
                </span>
              )}
              <span className="text-sm">{p.username}</span>
            </div>
          ))}
        </div>
      )}
      <MenuPlanner
        recipes={recipes}
        weeklyMenu={weeklyMenu}
        setWeeklyMenu={setWeeklyMenu}
        userProfile={userProfile}
        menuName={menuName}
        onUpdateMenuName={(name) => handleRename(selectedMenuId, name)}
        onDeleteMenu={() => handleDelete(selectedMenuId)}
      />
    </div>
  );
}
