import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useMenus() {
  const [menus, setMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('menus');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenus(parsed);
          setActiveMenuId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse menus from storage', e);
      }
    }
    const defaultMenu = {
      id: 'menu-' + Date.now(),
      name: 'Menu personnel',
      isShared: false,
      participantIds: [],
      preferences: {},
    };
    setMenus([defaultMenu]);
    setActiveMenuId(defaultMenu.id);
  }, []);

  useEffect(() => {
    localStorage.setItem('menus', JSON.stringify(menus));
  }, [menus]);

  const createMenu = ({ name, isShared, participantIds }) => {
    const newMenu = {
      id: 'menu-' + Date.now(),
      name: name || 'Nouveau menu',
      isShared: !!isShared,
      participantIds: Array.isArray(participantIds) ? participantIds : [],
      preferences: {},
    };
    setMenus((prev) => [...prev, newMenu]);
    setActiveMenuId(newMenu.id);
    return newMenu;
  };

  const renameMenu = async (menuId, newName) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === menuId ? { ...m, name: newName } : m))
    );
    try {
      await supabase
        .from('weekly_menus')
        .update({ name: newName })
        .eq('id', menuId);
    } catch (error) {
      console.error('Failed to rename menu:', error);
    }
  };

  const activeMenu = menus.find((m) => m.id === activeMenuId) || null;

  return {
    menus,
    activeMenu,
    activeMenuId,
    setActiveMenuId,
    createMenu,
    renameMenu,
  };
}
