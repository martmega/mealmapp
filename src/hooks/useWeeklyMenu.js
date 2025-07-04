import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase.js';
import { useToast } from '../components/ui/use-toast.js';
import { initialWeeklyMenuState } from '../lib/menu.js';
import { DEFAULT_MENU_PREFS } from '../lib/defaultPreferences.js';
import { fromDbPrefs, toDbPrefs } from '@/lib/menuPreferences';

/** @typedef {import('../types').WeeklyMenuPreferences} WeeklyMenuPreferences */
/** @typedef {import('../types').CommonMenuSettings} CommonMenuSettings */

const defaultPrefs = { ...DEFAULT_MENU_PREFS };

export { fromDbPrefs, toDbPrefs } from '@/lib/menuPreferences';

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function useWeeklyMenu(session, currentMenuId = null) {
  const supabase = getSupabase();
  const [weeklyMenu, setWeeklyMenu] = useState(initialWeeklyMenuState());
  const [menuName, setMenuName] = useState('Menu de la semaine');
  const [menuId, setMenuId] = useState(currentMenuId);
  const [isShared, setIsShared] = useState(false);
  const [preferences, setPreferences] = useState(defaultPrefs);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userId = session?.user?.id;

  useEffect(() => {
    setMenuId(currentMenuId);
  }, [currentMenuId]);

  const safeSetWeeklyMenu = useCallback((data) => {
    if (
      Array.isArray(data) &&
      data.length === 7 &&
      data.every((day) => Array.isArray(day))
    ) {
      setWeeklyMenu(data);
      setIsShared(false);
    } else if (
      data &&
      typeof data === 'object' &&
      data.menu_data &&
      Array.isArray(data.menu_data) &&
      data.menu_data.length === 7
    ) {
      setWeeklyMenu(data.menu_data);
      if ('name' in data) setMenuName(data.name);
      if ('id' in data) setMenuId(data.id);
      if ('is_shared' in data)
        setIsShared(typeof data.is_shared === 'boolean' ? data.is_shared : !!data.is_shared);
    } else {
      setWeeklyMenu(initialWeeklyMenuState());
      if (data && typeof data === 'object') {
        if ('name' in data) setMenuName(data.name);
        if ('id' in data) setMenuId(data.id);
        if ('is_shared' in data) {
          setIsShared(typeof data.is_shared === 'boolean' ? data.is_shared : !!data.is_shared);
        } else {
          setIsShared(false);
        }
      } else {
        setIsShared(false);
      }
    }
  }, []);

  const fetchWeeklyMenu = useCallback(
    async (id = menuId) => {
      if (!id) {
        console.warn('Menu ID is null — impossible de charger les préférences');
      }
      if (!id && !userId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('weekly_menus')
          .select(
            'id, user_id, name, menu_data, is_shared, created_at, updated_at'
          )
          .eq(id ? 'id' : 'user_id', id || userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const menuIsShared = !!data.is_shared;
          safeSetWeeklyMenu(data);

          const { data: pref, error: prefError } = await supabase
            .from('weekly_menu_preferences')
            .select('*')
            .eq('menu_id', data.id)
            .maybeSingle();

          if (prefError && prefError.code !== 'PGRST116') throw prefError;

          if (pref) {
            setPreferences(fromDbPrefs(pref));
          } else {
            const safePrefs = menuIsShared
              ? toDbPrefs(DEFAULT_MENU_PREFS)
              : toDbPrefs({
                  ...DEFAULT_MENU_PREFS,
                  commonMenuSettings: { enabled: false },
                });

            const { data: inserted, error: insertErr } = await supabase
              .from('weekly_menu_preferences')
              .insert({ menu_id: data.id, ...safePrefs })
              .select('*')
              .single();
            if (!insertErr && inserted) setPreferences(fromDbPrefs(inserted));
          }
        }
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
    },
    [userId, toast, safeSetWeeklyMenu, menuId]
  );

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

    fetchWeeklyMenu();
  }, [session, userId, menuId, toast, safeSetWeeklyMenu, fetchWeeklyMenu]);

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
        const upsertData = {
          user_id: userId,
          menu_data: validatedMenu,
          name: menuName,
        };

        if (menuId && isValidUUID(menuId)) {
          upsertData.id = menuId;
        }

        const { data: upserted, error: upsertError } = await supabase
          .from('weekly_menus')
          .upsert(upsertData)
          .select(
            'id, user_id, name, menu_data, is_shared, created_at, updated_at'
          )
          .single();

        if (upsertError) throw upsertError;
        if (upserted?.id) setMenuId(upserted.id);
        toast({
          title: 'Menu sauvegardé',
          description: 'Votre menu hebdomadaire a été sauvegardé avec succès.',
        });
        await fetchWeeklyMenu(upserted?.id || menuId);
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
    async (newName, id = menuId) => {
      if (!userId || !id || !newName) return false;
      try {
        const { error } = await supabase
          .from('weekly_menus')
          .update({ name: newName })
          .eq('id', id);

        if (error) throw error;
        if (id === menuId) setMenuName(newName);
        await fetchWeeklyMenu(id);
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
    [userId, menuId, fetchWeeklyMenu, toast]
  );

  const updateMenuPreferences = useCallback(
    async (newPrefs, id = menuId) => {
      if (!userId || !id) return false;
      try {
        const merged = { ...preferences, ...(newPrefs || {}) };
        if (!isShared) merged.commonMenuSettings = {};
        const { data: updated, error } = await supabase
          .from('weekly_menu_preferences')
          .upsert({ menu_id: id, ...toDbPrefs(merged) }, { onConflict: 'menu_id' })
          .select('*')
          .single();

        if (error) throw error;
        if (updated) setPreferences(fromDbPrefs(updated));
        return true;
      } catch (err) {
        console.error('Error updating preferences:', err);
        toast({
          title: 'Erreur',
          description:
            'Impossible de mettre \xC3\xA0 jour les pr\xC3\xA9f\xC3\xA9rences: ' +
            err.message,
          variant: 'destructive',
        });
        return false;
      }
    },
    [userId, menuId, toast, preferences, isShared]
  );


  const deleteWeeklyMenu = useCallback(
    async (id = menuId) => {
      if (!userId || !id) return false;
      try {
        const { error } = await supabase
          .from('weekly_menus')
          .delete()
          .eq('id', id);

        if (error) throw error;
        if (id === menuId) {
          await fetchWeeklyMenu(null);
        }
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
    },
    [userId, menuId, fetchWeeklyMenu, toast]
  );

  return {
    weeklyMenu,
    menuName,
    isShared,
    setWeeklyMenu: saveWeeklyMenuToSupabase,
    updateMenuName: updateWeeklyMenuName,
    preferences,
    updatePreferences: updateMenuPreferences,
    deleteMenu: deleteWeeklyMenu,
    loading,
  };
}
