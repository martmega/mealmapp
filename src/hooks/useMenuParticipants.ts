import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export type MenuParticipant = {
  user_id: string;
  weight?: number;
  username?: string | null;
  user_tag?: string | null;
};

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
        let rows = (data ?? []).map((r) => ({
          user_id: r.user_id,
          weight: r.weight ?? undefined,
        }));
        if (rows.length) {
          const { data: users, error: uErr } = await supabase
            .from('public_user_view')
            .select('id, username, user_tag')
            .in(
              'id',
              rows.map((r) => r.user_id)
            );
          if (uErr) throw uErr;
          const map = new Map(
            (users ?? []).map((u) => [u.id, u] as const)
          );
          rows = rows.map((r) => ({
            ...r,
            username: map.get(r.user_id)?.username ?? null,
            user_tag: map.get(r.user_id)?.user_tag ?? null,
          }));
        }
        if (!cancelled) setRows(rows);
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

