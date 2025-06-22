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
    } else {
      setWeeklyMenu(initialWeeklyMenuState());
    }
  }, []);

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

    const fetchUserWeeklyMenu = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('weekly_menus')
          .select('id, user_id, menu_data, created_at, updated_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        safeSetWeeklyMenu(data?.menu_data);
      } catch (err) {
        console.error('Erreur fetch weekly menu :', err);
        toast({
          title: 'Erreur',
          description:
            'Impossible de charger le menu hebdomadaire: ' + err.message,
          variant: 'destructive',
        });
        safeSetWeeklyMenu(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserWeeklyMenu();
  }, [session, userId, toast, safeSetWeeklyMenu]);

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
        };

        if (existingMenu && existingMenu.id) {
          upsertData.id = existingMenu.id;
        }

        const { error: upsertError } = await supabase
          .from('weekly_menus')
          .upsert(upsertData, { onConflict: 'user_id' })
          .select('id, user_id, menu_data, created_at, updated_at');

        if (upsertError) throw upsertError;
        toast({
          title: 'Menu sauvegardé',
          description: 'Votre menu hebdomadaire a été sauvegardé avec succès.',
        });
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

  return { weeklyMenu, setWeeklyMenu: saveWeeklyMenuToSupabase, loading };
}
