import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import MenuPlanner from '@/components/MenuPlanner';
import NewMenuModal from '@/components/NewMenuModal.jsx';
import { useFriendsList } from '@/hooks/useFriendsList.js';
import { Input } from '@/components/ui/input.jsx';
import { Edit2 } from 'lucide-react';

export default function MenuPage({
  session,
  userProfile,
  recipes,
  menus,
  activeMenuId,
  setActiveMenuId,
  createMenu,
  renameMenu,
  weeklyMenu,
  setWeeklyMenu,
}) {
  const friends = useFriendsList(session);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const startEdit = (menu) => {
    setEditingId(menu.id);
    setEditName(menu.name || '');
  };

  const submitEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (trimmed) {
      await renameMenu(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-4">
      <Tabs value={activeMenuId} onValueChange={setActiveMenuId}>
        <TabsList className="flex flex-wrap gap-2 overflow-x-auto">
          {menus.map((m) => (
            <TabsTrigger
              key={m.id}
              value={m.id}
              className="whitespace-nowrap flex items-center gap-1"
            >
              {editingId === m.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={submitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitEdit();
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  className="h-6 px-1 py-0 text-sm"
                />
              ) : (
                <>
                  <span>
                    {m.name}
                    {m.isShared && ' (commun)'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startEdit(m);
                    }}
                    className="ml-1 text-xs hover:text-pastel-foreground"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </>
              )}
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
