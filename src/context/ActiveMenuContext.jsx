import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeeklyMenu } from '@/hooks/useWeeklyMenu.js';

const ActiveMenuContext = createContext({
  selectedMenuId: null,
  setSelectedMenuId: () => {},
  weeklyMenu: [],
  menuName: 'Menu de la semaine',
  setWeeklyMenu: () => {},
  updateMenuName: () => {},
  deleteMenu: () => {},
  loading: false,
});

export function ActiveMenuProvider({ children, session }) {
  const userId = session?.user?.id;
  const storageKey = `selectedMenuId-${userId || 'guest'}`;
  const [selectedMenuId, setSelectedMenuId] = useState(() =>
    localStorage.getItem(storageKey)
  );

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored && stored !== selectedMenuId) {
      setSelectedMenuId(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (selectedMenuId) {
      localStorage.setItem(storageKey, selectedMenuId);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [selectedMenuId, storageKey]);

  const {
    weeklyMenu,
    menuName,
    setWeeklyMenu,
    updateMenuName,
    deleteMenu,
    loading,
  } = useWeeklyMenu(session, selectedMenuId);

  return (
    <ActiveMenuContext.Provider
      value={{
        selectedMenuId,
        setSelectedMenuId,
        weeklyMenu,
        menuName,
        setWeeklyMenu,
        updateMenuName,
        deleteMenu,
        loading,
      }}
    >
      {children}
    </ActiveMenuContext.Provider>
  );
}

export function useActiveMenu() {
  return useContext(ActiveMenuContext);
}
