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

export async function syncMenuParticipants(
  supabase: any,
  menuId: string,
  selected: MenuParticipant[]
) {
  const norm = normalizeWeights(selected);

  // Lire l'existant pour calculer la diff (utile pour logs et delete)
  const { data: existing, error: readErr } = await supabase
    .from('menu_participants')
    .select('user_id')
    .eq('menu_id', menuId);
  if (readErr) throw readErr;

  const existingIds = new Set((existing ?? []).map((r: any) => r.user_id));
  const keepIds = new Set(norm.map((r) => r.user_id));
  const toRemove = [...existingIds].filter((id) => !keepIds.has(id));

  console.groupCollapsed('[syncMenuParticipants]');
  console.info({ menuId, selected: norm, existing, toRemove });
  console.groupEnd();

  // upsert (ajout + update poids)
  if (norm.length) {
    const { error: upErr } = await supabase
      .from('menu_participants')
      .upsert(
        norm.map((r) => ({ menu_id: menuId, user_id: r.user_id, weight: r.weight })),
        { onConflict: 'menu_id,user_id' }
      );
    if (upErr) throw upErr;
  }

  // delete (retirer ceux qui ne sont plus sélectionnés)
  if (toRemove.length) {
    const { error: delErr } = await supabase
      .from('menu_participants')
      .delete()
      .eq('menu_id', menuId)
      .in('user_id', toRemove);
    if (delErr) throw delErr;
  }
}

