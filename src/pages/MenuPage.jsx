import React from 'react';
import MenuPlanner from '@/components/MenuPlanner';

export default function MenuPage({
  session,
  userProfile,
  recipes,
  weeklyMenu,
  setWeeklyMenu,
}) {
  return (
    <div className="p-6">
      <MenuPlanner
        recipes={recipes}
        weeklyMenu={weeklyMenu}
        setWeeklyMenu={setWeeklyMenu}
        userProfile={userProfile}
      />
    </div>
  );
}
