import type { MenuParticipant } from '@/hooks/useMenuParticipants';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function normalizeWeights(list: MenuParticipant[]) {
  const rows = list.map((r) => ({ ...r }));
  if (!rows.some((r) => Number.isFinite(r.weight as number))) {
    const w = rows.length ? 1 / rows.length : 0;
    rows.forEach((r) => (r.weight = w));
  } else {
    rows.forEach((r) => (r.weight = clamp01(Number(r.weight ?? 0))));
  }
  return rows;
}

/**
 * Sync participants for a menu on the client side. Note that server-side
 * creation (e.g. the `create-shared-menu` API route) may also insert rows into
 * `menu_participants`, so this isn't the only writer to that table.
 */
export async function syncMenuParticipants(
  supabase: any,
  menuId: string,
  selected: MenuParticipant[]
) {
  let existing: any[] = [];
  try {
    const { data, error } = await supabase
      .from('menu_participants')
      .select('user_id')
      .eq('menu_id', menuId);
    if (error) throw error;
    existing = data ?? [];
  } catch (e) {
    console.error('[syncMenuParticipants] read error', e);
    throw e;
  }

  const keep = new Set(selected.map((p) => p.user_id));
  const toRemove = existing
    .map((r: any) => r.user_id)
    .filter((id: string) => !keep.has(id));

  try {
    await supabase.from('menu_participants').upsert(
      selected.map((p) => ({
        menu_id: menuId,
        user_id: p.user_id,
        weight: clamp01(p.weight ?? 1 / selected.length),
      })),
      { onConflict: 'menu_id,user_id' }
    );
  } catch (e) {
    console.error('[syncMenuParticipants] upsert error', e);
    throw e;
  }

  if (toRemove.length) {
    try {
      await supabase
        .from('menu_participants')
        .delete()
        .eq('menu_id', menuId)
        .in('user_id', toRemove);
    } catch (e) {
      console.error('[syncMenuParticipants] delete error', e);
      throw e;
    }
  }

  console.info('[syncMenuParticipants]', { menuId, selected, existing, toRemove });
}

