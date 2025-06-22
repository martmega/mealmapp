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
        <TabsList className="flex flex-wrap gap-2 overflow-x-auto">
          {menus.map((m) => (
            <TabsTrigger key={m.id} value={m.id} className="whitespace-nowrap">
              {m.name}
              {m.isShared && ' (commun)'}
            </TabsTrigger>
          ))}
          <NewMenuModal
            onCreate={createMenu}
            friends={friends}
            trigger={<TabsTrigger value="new">+ Nouveau menu</TabsTrigger>}
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
