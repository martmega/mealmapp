import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { fetchMenusForUser } from './useMenus.js';

export function useMenuList(session) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userId = session?.user?.id;

  const fetchMenus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await fetchMenusForUser(userId);
      setMenus(list);
    } catch (err) {
      console.error('Erreur chargement menus:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les menus: ' + err.message,
        variant: 'destructive',
      });
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  return { menus, loading, refreshMenus: fetchMenus };
}
