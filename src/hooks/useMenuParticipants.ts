import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export type MenuParticipant = { user_id: string; weight?: number };

export function useMenuParticipants(
  supabase: ReturnType<typeof createClient>,
  menuId?: string
) {
  const [rows, setRows] = useState<MenuParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!menuId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('menu_participants')
          .select('user_id, weight')
          .eq('menu_id', menuId);
        if (error) throw error;
        if (!cancelled)
          setRows(
            (data ?? []).map((r) => ({
              user_id: r.user_id,
              weight: r.weight ?? undefined,
            }))
          );
      } catch (e: any) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, menuId]);

  return { rows, setRows, loading, error };
}

