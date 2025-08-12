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
  console.groupCollapsed('[ParticipantsSync]');
  let existing: any[] = [];
  let toRemove: string[] = [];
  let upsertRows: any[] = [];

  console.log('before read', {
    menuId,
    selected,
    selectedLength: selected.length,
    existing,
    toRemove,
    upsertRows,
  });
  const { data, error: readErr } = await supabase
    .from('menu_participants')
    .select('user_id')
    .eq('menu_id', menuId);
  console.log('readErr', readErr);
  if (readErr) {
    console.error('[syncMenuParticipants] read error', readErr);
    console.groupEnd();
    throw readErr;
  }
  existing = data ?? [];

  const keep = new Set(selected.map((p) => p.user_id));
  toRemove = existing
    .map((r: any) => r.user_id)
    .filter((id: string) => !keep.has(id));
  upsertRows = selected.map((p) => ({
    menu_id: menuId,
    user_id: p.user_id,
    weight: clamp01(p.weight ?? 1 / selected.length),
  }));

  console.log('before upsert', {
    menuId,
    selected,
    selectedLength: selected.length,
    existing,
    toRemove,
    upsertRows,
  });
  const { error: upErr } = await supabase
    .from('menu_participants')
    .upsert(upsertRows, { onConflict: 'menu_id,user_id' });
  console.log('upErr', upErr);
  if (upErr) {
    console.error('[syncMenuParticipants] upsert error', upErr);
    console.groupEnd();
    throw upErr;
  }

  if (toRemove.length) {
    console.log('before delete', {
      menuId,
      selected,
      selectedLength: selected.length,
      existing,
      toRemove,
      upsertRows,
    });
    const { error: delErr } = await supabase
      .from('menu_participants')
      .delete()
      .eq('menu_id', menuId)
      .in('user_id', toRemove);
    console.log('delErr', delErr);
    if (delErr) {
      console.error('[syncMenuParticipants] delete error', delErr);
      console.groupEnd();
      throw delErr;
    }
  }

  console.groupEnd();
}

