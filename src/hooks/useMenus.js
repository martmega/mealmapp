import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useMenus(session) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMenus = async () => {
      if (!session?.user?.id) {
        setMenus([]);
        return;
      }
      setLoading(true);
      try {
        const { data: ownedMenus, error: ownedError } = await supabase
          .from('menus')
          .select('id, name, is_shared, owner_id, created_at')
          .eq('owner_id', session.user.id);
        if (ownedError) throw ownedError;

        const { data: links, error: linkError } = await supabase
          .from('menu_participants')
          .select('menu_id')
          .eq('user_id', session.user.id);
        if (linkError) throw linkError;

        const menuIds = Array.isArray(links) ? links.map((l) => l.menu_id) : [];
        let participantMenus = [];
        if (menuIds.length > 0) {
          const { data: fetched, error: fetchError } = await supabase
            .from('menus')
            .select('id, name, is_shared, owner_id, created_at')
            .in('id', menuIds);
          if (fetchError) throw fetchError;
          participantMenus = fetched || [];
        }

        const uniqueMap = new Map();
        [...(ownedMenus || []), ...participantMenus].forEach((m) => {
          if (m && m.id) uniqueMap.set(m.id, m);
        });
        setMenus(Array.from(uniqueMap.values()));
      } catch (err) {
        console.error('Error fetching menus:', err);
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [session]);

  const createMenu = async ({ name, isShared, participantIds = [] }) => {
    if (!session?.user?.id || !name) return null;
    setLoading(true);
    try {
      const { data: created, error } = await supabase
        .from('menus')
        .insert({ name, is_shared: !!isShared, owner_id: session.user.id })
        .select()
        .single();
      if (error) throw error;

      const menu = created;
      const participantRows = [
        { menu_id: menu.id, user_id: session.user.id },
        ...participantIds.map((uid) => ({ menu_id: menu.id, user_id: uid })),
      ];
      await supabase.from('menu_participants').insert(participantRows);
      setMenus((prev) => [menu, ...(Array.isArray(prev) ? prev : [])]);
      return menu;
    } catch (err) {
      console.error('Error creating menu:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { menus, loading, createMenu };
}
