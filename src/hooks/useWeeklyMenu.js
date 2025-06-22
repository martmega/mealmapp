import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { initialWeeklyMenuState } from '@/lib/menu';

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function useWeeklyMenu(session) {
  const [weeklyMenu, setWeeklyMenu] = useState(initialWeeklyMenuState());
  const [menuName, setMenuName] = useState('Menu de la semaine');
  const [menuId, setMenuId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userId = session?.user?.id;

  const safeSetWeeklyMenu = useCallback((data) => {
    if (
      Array.isArray(data) &&
      data.length === 7 &&
      data.every((day) => Array.isArray(day))
    ) {
      setWeeklyMenu(data);
    } else if (
      data &&
      typeof data === 'object' &&
      data.menu_data &&
      Array.isArray(data.menu_data) &&
      data.menu_data.length === 7
    ) {
      setWeeklyMenu(data.menu_data);
      if (data.name) setMenuName(data.name);
      if (data.id) setMenuId(data.id);
    } else {
      setWeeklyMenu(initialWeeklyMenuState());
    }
  }, []);

  const fetchUserWeeklyMenu = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_menus')
        .select('id, user_id, name, menu_data, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) safeSetWeeklyMenu(data);
    } catch (err) {
      console.error('Erreur fetch weekly menu :', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le menu hebdomadaire: ' + err.message,
        variant: 'destructive',
      });
      safeSetWeeklyMenu(null);
    } finally {
      setLoading(false);
    }
  }, [userId, toast, safeSetWeeklyMenu]);

  useEffect(() => {
    const loadLocalMenu = () => {
      const saved = localStorage.getItem(
        `localWeeklyMenu-${userId || 'guest'}`
      );
      try {
        const parsed = saved ? JSON.parse(saved) : null;
        safeSetWeeklyMenu(parsed);
      } catch (e) {
        safeSetWeeklyMenu(null);
      }
      setLoading(false);
    };

    if (!userId) {
      loadLocalMenu();
      return;
    }

    fetchUserWeeklyMenu();
  }, [session, userId, toast, safeSetWeeklyMenu, fetchUserWeeklyMenu]);

  useEffect(() => {
    if (!userId) {
      localStorage.setItem(
        `localWeeklyMenu-${userId || 'guest'}`,
        JSON.stringify(weeklyMenu)
      );
      return;
    }
  }, [weeklyMenu, session, userId]);

  const saveWeeklyMenuToSupabase = async (newMenu) => {
    const validatedMenu =
      Array.isArray(newMenu) && newMenu.length === 7
        ? newMenu.map((day) =>
            Array.isArray(day)
              ? day.map((meal) =>
                  Array.isArray(meal)
                    ? meal.map((recipe) => ({
                        ...recipe,
                        id: recipe.id?.split('_')[0],
                      }))
                    : []
                )
              : []
          )
        : initialWeeklyMenuState();

    setWeeklyMenu(validatedMenu);

    if (userId) {
      setLoading(true);
      try {
        const { data: existingMenu, error: fetchError } = await supabase
          .from('weekly_menus')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const upsertData = {
          user_id: userId,
          menu_data: validatedMenu,
          name: menuName,
        };

        if (existingMenu && existingMenu.id) {
          upsertData.id = existingMenu.id;
        }

        const { error: upsertError } = await supabase
          .from('weekly_menus')
          .upsert(upsertData, { onConflict: 'user_id' })
          .select('id, user_id, name, menu_data, created_at, updated_at');

        if (upsertError) throw upsertError;
        toast({
          title: 'Menu sauvegardé',
          description: 'Votre menu hebdomadaire a été sauvegardé avec succès.',
        });
        await fetchUserWeeklyMenu();
      } catch (error) {
        console.error('Error saving weekly menu:', error);
        toast({
          title: 'Erreur de sauvegarde',
          description: 'Impossible de sauvegarder le menu: ' + error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      localStorage.setItem(
        `localWeeklyMenu-${userId || 'guest'}`,
        JSON.stringify(validatedMenu)
      );
    }
  };

  const updateWeeklyMenuName = useCallback(
    async (newName) => {
      if (!userId || !menuId || !newName) return false;
      try {
        const { error } = await supabase
          .from('weekly_menus')
          .update({ name: newName })
          .eq('id', menuId);

        if (error) throw error;
        setMenuName(newName);
        await fetchUserWeeklyMenu();
        return true;
      } catch (err) {
        console.error('Error updating menu name:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de renommer le menu: ' + err.message,
          variant: 'destructive',
        });
      return false;
    }
  },
  [userId, menuId, fetchUserWeeklyMenu, toast]
);

  const deleteWeeklyMenu = useCallback(async () => {
    if (!userId || !menuId) return false;
    try {
      const { error } = await supabase
        .from('weekly_menus')
        .delete()
        .eq('id', menuId);

      if (error) throw error;
      await fetchUserWeeklyMenu();
      toast({ title: 'Menu supprimé' });
      return true;
    } catch (err) {
      console.error('Error deleting menu:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le menu: ' + err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, menuId, fetchUserWeeklyMenu, toast]);

  return {
    weeklyMenu,
    menuName,
    setWeeklyMenu: saveWeeklyMenuToSupabase,
    updateMenuName: updateWeeklyMenuName,
    deleteMenu: deleteWeeklyMenu,
    loading,
  };
}
