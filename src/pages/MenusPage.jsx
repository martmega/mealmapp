import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import NewMenuModal from '@/components/NewMenuModal.jsx';
import { Button } from '@/components/ui/button.jsx';

function MenuCard({ menu, isActive, onActivate }) {
  return (
    <li className="flex items-center justify-between bg-pastel-card p-3 rounded-md">
      <span>
        {menu.name}
        {menu.is_shared && ' (commun)'}
      </span>
      {isActive ? (
        <span className="text-sm">Actif</span>
      ) : (
        <Button size="sm" onClick={() => onActivate(menu.id)}>
          Activer
        </Button>
      )}
    </li>
  );
}

export default function MenusPage({ session }) {
  const userId = session?.user?.id;
  const [createdMenus, setCreatedMenus] = useState([]);
  const [participatingMenus, setParticipatingMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('weekly_menus')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        setCreatedMenus(data || []);
        if (data && data.length > 0 && !activeMenuId) {
          setActiveMenuId(data[0].id);
        }
      });

    supabase
      .from('menu_participants')
      .select('menu_id, weekly_menus(*)')
      .eq('user_id', userId)
      .then(({ data }) => {
        const menus = data?.map((d) => d.weekly_menus).filter(Boolean) || [];
        setParticipatingMenus(menus);
      });
  }, [userId]);

  const allMenus = useMemo(() => {
    const ids = new Set();
    return [...createdMenus, ...participatingMenus].filter((menu) => {
      if (ids.has(menu.id)) return false;
      ids.add(menu.id);
      return true;
    });
  }, [createdMenus, participatingMenus]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes menus</h2>
        <NewMenuModal onCreate={() => {}} friends={[]} />
      </div>
      <ul className="space-y-2">
        {allMenus.map((m) => (
          <MenuCard
            key={m.id}
            menu={m}
            isActive={activeMenuId === m.id}
            onActivate={setActiveMenuId}
          />
        ))}
      </ul>
    </div>
  );
}
