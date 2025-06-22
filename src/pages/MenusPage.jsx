import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import NewMenuModal from '@/components/NewMenuModal.jsx';
import { Button } from '@/components/ui/button.jsx';

function MenuCard({ menu, isActive, onActivate, onDelete }) {
  return (
    <li className="flex items-center justify-between bg-pastel-card p-3 rounded-md">
      <span>
        {menu.name}
        {menu.is_shared && ' (commun)'}
      </span>
      <div className="flex items-center gap-2">
        {isActive ? (
          <span className="text-sm">Actif</span>
        ) : (
          <Button size="sm" onClick={() => onActivate(menu.id)}>
            Activer
          </Button>
        )}
        <button
          className="text-red-600 hover:bg-red-100 rounded px-2"
          onClick={() => onDelete(menu.id)}
        >
          ×
        </button>
      </div>
    </li>
  );
}

export default function MenusPage({ session }) {
  const userId = session?.user?.id;
  const [createdMenus, setCreatedMenus] = useState([]);
  const [participatingMenus, setParticipatingMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const fetchMenus = useCallback(async () => {
    if (!userId) return { created: [], participants: [] };

    const { data: created } = await supabase
      .from('weekly_menus')
      .select('*')
      .eq('user_id', userId);

    const { data: partData } = await supabase
      .from('menu_participants')
      .select('menu_id, weekly_menus(*)')
      .eq('user_id', userId);

    const partMenus = partData?.map((d) => d.weekly_menus).filter(Boolean) || [];

    setCreatedMenus(created || []);
    setParticipatingMenus(partMenus);

    return { created: created || [], participants: partMenus };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchMenus().then(({ created }) => {
      if (created.length > 0 && !activeMenuId) {
        setActiveMenuId(created[0].id);
      }
    });
  }, [userId, activeMenuId, fetchMenus]);

  const allMenus = useMemo(() => {
    const ids = new Set();
    return [...createdMenus, ...participatingMenus].filter((menu) => {
      if (ids.has(menu.id)) return false;
      ids.add(menu.id);
      return true;
    });
  }, [createdMenus, participatingMenus]);

  const handleDelete = async (menuId) => {
    if (!confirm('Es-tu sûr de vouloir supprimer ce menu ?')) return;

    await supabase.from('weekly_menus').delete().eq('id', menuId);

    const { created, participants } = await fetchMenus();
    const combined = [...created, ...participants];

    if (activeMenuId === menuId) {
      setActiveMenuId(combined[0]?.id || null);
    }
  };

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
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </div>
  );
}
