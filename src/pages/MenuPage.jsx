import React from 'react';
import MenuPlanner from '@/components/MenuPlanner';
import MenuTabs from '@/components/MenuTabs.jsx';
import { useMenus } from '@/hooks/useMenus.js';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';

export default function MenuPage({ session, userProfile, recipes }) {
  const { menus, selectedMenuId, setSelectedMenuId, refreshMenus } =
    useMenus(session);

  const { weeklyMenu, menuName, setWeeklyMenu, updateMenuName, deleteMenu } =
    useWeeklyMenu(session, selectedMenuId);

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

  return (
    <div className="p-6 space-y-4">
      <MenuTabs
        menus={menus}
        activeMenuId={selectedMenuId}
        onSelect={setSelectedMenuId}
        currentUserId={session?.user?.id}
        onRename={handleRename}
        onDelete={handleDelete}
      />
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
