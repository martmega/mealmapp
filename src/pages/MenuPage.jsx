import React from 'react';
import MenuPlanner from '@/components/MenuPlanner';

export default function MenuPage({
  session,
  userProfile,
  recipes,
  weeklyMenu,
  setWeeklyMenu,
  menuName,
  updateMenuName,
  deleteMenu,
}) {
  return (
    <div className="p-6">
      <MenuPlanner
        recipes={recipes}
        weeklyMenu={weeklyMenu}
        setWeeklyMenu={setWeeklyMenu}
        userProfile={userProfile}
        menuName={menuName}
        onUpdateMenuName={updateMenuName}
        onDeleteMenu={deleteMenu}
      />
    </div>
  );
}
