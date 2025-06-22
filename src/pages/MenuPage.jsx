import React, { useState, useEffect } from 'react';
import MenuPlanner from '@/components/MenuPlanner';
import MenuTabs from '@/components/MenuTabs.jsx';
import { useMenuList } from '@/hooks/useMenuList.js';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';

export default function MenuPage({ session, userProfile, recipes }) {
  const { menus, refreshMenus } = useMenuList(session);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const { weeklyMenu, menuName, setWeeklyMenu, updateMenuName, deleteMenu } =
    useWeeklyMenu(session, activeMenuId);

  useEffect(() => {
    if (!activeMenuId && Array.isArray(menus) && menus.length > 0) {
      setActiveMenuId(menus[0].id);
    }
  }, [menus, activeMenuId]);

  const handleRename = async (id, name) => {
    await updateMenuName(name, id);
    refreshMenus();
  };

  const handleDelete = async (id) => {
    await deleteMenu(id);
    refreshMenus();
    if (id === activeMenuId) {
      const remaining = menus.filter((m) => m.id !== id);
      setActiveMenuId(remaining[0]?.id || null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <MenuTabs
        menus={menus}
        activeMenuId={activeMenuId}
        onSelect={setActiveMenuId}
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
        onUpdateMenuName={(name) => handleRename(activeMenuId, name)}
        onDeleteMenu={() => handleDelete(activeMenuId)}
      />
    </div>
  );
}
