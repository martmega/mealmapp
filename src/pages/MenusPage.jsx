import React from 'react';
import { useMenus } from '@/hooks/useMenus.js';
import { useFriendsList } from '@/hooks/useFriendsList.js';
import NewMenuModal from '@/components/NewMenuModal.jsx';
import { Button } from '@/components/ui/button.jsx';

export default function MenusPage({ session }) {
  const { menus, activeMenuId, setActiveMenuId, createMenu } = useMenus();
  const friends = useFriendsList(session);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes menus</h2>
        <NewMenuModal onCreate={createMenu} friends={friends} />
      </div>
      <ul className="space-y-2">
        {menus.map((m) => (
          <li key={m.id} className="flex items-center justify-between bg-pastel-card p-3 rounded-md">
            <span>
              {m.name}
              {m.isShared && ' (commun)'}
            </span>
            {activeMenuId === m.id ? (
              <span className="text-sm">Actif</span>
            ) : (
              <Button size="sm" onClick={() => setActiveMenuId(m.id)}>
                Activer
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
