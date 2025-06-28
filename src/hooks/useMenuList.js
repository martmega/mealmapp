import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const supabase = getSupabase();

export function useMenuList(session) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userId = session?.user?.id;

  const fetchMenus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: ownerMenus, error: ownerError } = await supabase
        .from('weekly_menus')
        .select('id, user_id, name, updated_at, is_shared')
        .eq('user_id', userId)
        .order('created_at');

      if (ownerError && ownerError.code !== 'PGRST116') {
        throw ownerError;
      }

      const { data: participantRows, error: participantError } = await supabase
        .from('menu_participants')
        .select('menu_id')
        .eq('user_id', userId);

      if (participantError && participantError.code !== 'PGRST116') {
        throw participantError;
      }

      const participantIds = (participantRows || []).map((r) => r.menu_id);
      let participantMenus = [];
      if (participantIds.length > 0) {
        const { data, error } = await supabase
          .from('weekly_menus')
          .select('id, user_id, name, updated_at, is_shared')
          .in('id', participantIds);
        if (error) throw error;
        participantMenus = data || [];
      }

      const combined = [...(ownerMenus || []), ...participantMenus];
      const unique = [];
      const seen = new Set();
      for (const m of combined) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          unique.push(m);
        }
      }

      // `is_shared` is selected directly from weekly_menus

      setMenus(unique);
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
