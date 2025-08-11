export type Participant = { user_id: string; username?: string; weight?: number };

export function normalizeWeights(rows: Participant[]): Participant[] {
  const any = rows.some(p => Number.isFinite(p.weight));
  if (!any) {
    const w = rows.length ? 1 / rows.length : 0;
    rows.forEach(p => (p.weight = w));
  } else {
    rows.forEach(p => {
      const v = Number(p.weight);
      p.weight = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    });
  }
  return rows;
}

export async function syncMenuParticipants(
  supabase: any,
  menu_id: string,
  selected: Participant[]
) {
  const rows = normalizeWeights([...selected]).map(p => ({
    menu_id,
    user_id: p.user_id,
    weight: Number.isFinite(p.weight as number) ? (p.weight as number) : 0,
  }));

  const { data: existing, error: readErr } = await supabase
    .from('menu_participants')
    .select('user_id')
    .eq('menu_id', menu_id);

  if (readErr) throw readErr;

  const existingIds = new Set((existing ?? []).map((r: any) => r.user_id));
  const keepIds = new Set(rows.map(r => r.user_id));

  const toAddOrUpdate = rows;
  const toRemove = [...existingIds].filter(id => !keepIds.has(id));

  if (toAddOrUpdate.length) {
    const { error: upErr } = await supabase
      .from('menu_participants')
      .upsert(toAddOrUpdate, { onConflict: 'menu_id,user_id' });
    if (upErr) throw upErr;
  }

  if (toRemove.length) {
    const { error: delErr } = await supabase
      .from('menu_participants')
      .delete()
      .eq('menu_id', menu_id)
      .in('user_id', toRemove);
    if (delErr) throw delErr;
  }
}

