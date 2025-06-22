import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import MenuPlanner from '@/components/MenuPlanner';
import NewMenuModal from '@/components/NewMenuModal.jsx';
import { useFriendsList } from '@/hooks/useFriendsList.js';

export default function MenuPage({
  session,
  userProfile,
  recipes,
  menus,
  activeMenuId,
  setActiveMenuId,
  createMenu,
  weeklyMenu,
  setWeeklyMenu,
}) {
  const friends = useFriendsList(session);

  return (
    <div className="p-6 space-y-4">
      <Tabs value={activeMenuId} onValueChange={setActiveMenuId}>
        <TabsList className="flex flex-wrap gap-2 overflow-x-auto mt-4 bg-transparent p-0 text-current">
          {menus.map((m) => (
            <TabsTrigger
              key={m.id}
              value={m.id}
              className={`cursor-pointer px-3 py-1 rounded border transition-all whitespace-nowrap ${
                activeMenuId === m.id
                  ? 'bg-purple-600 text-white font-bold border-purple-600'
                  : 'border-purple-600 text-purple-600 hover:bg-purple-100'
              }`}
            >
              {m.name}
              {m.isShared && ' (commun)'}
            </TabsTrigger>
          ))}
          <NewMenuModal
            onCreate={createMenu}
            friends={friends}
            trigger={
              <TabsTrigger
                value="new"
                className="cursor-pointer px-3 py-1 rounded border border-dashed border-purple-600 text-purple-600 hover:bg-purple-100"
              >
                + Nouveau menu
              </TabsTrigger>
            }
          />
        </TabsList>
        {menus.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-4">
            {activeMenuId === m.id && (
              <MenuPlanner
                recipes={recipes}
                weeklyMenu={weeklyMenu}
                setWeeklyMenu={setWeeklyMenu}
                userProfile={userProfile}
              />
            )}
          </TabsContent>
        ))}
        <TabsContent value="new" />
      </Tabs>
    </div>
  );
}
