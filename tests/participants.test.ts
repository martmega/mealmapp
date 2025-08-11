import { describe, it, expect, vi } from 'vitest';
import { normalizeWeights, syncMenuParticipants } from '../src/lib/syncMenuParticipants';

describe('normalizeWeights', () => {
  it('distributes evenly when weights are empty', () => {
    const rows = [{ user_id: 'a' }, { user_id: 'b' }];
    const result = normalizeWeights(rows);
    expect(result[0].weight).toBeCloseTo(0.5);
    expect(result[1].weight).toBeCloseTo(0.5);
  });

  it('clamps weights to 0..1', () => {
    const rows = [
      { user_id: 'a', weight: -0.2 },
      { user_id: 'b', weight: 1.5 },
    ];
    const result = normalizeWeights(rows);
    expect(result[0].weight).toBe(0);
    expect(result[1].weight).toBe(1);
  });
});

describe('syncMenuParticipants', () => {
  function createMockSupabase(initial = []) {
    const state = { rows: [...initial] };
    return {
      state,
      from() {
        const table = arguments[0];
        if (table !== 'menu_participants') throw new Error('unexpected table');
        return {
          select() {
            return {
              eq(_, menuId) {
                const data = state.rows
                  .filter((r) => r.menu_id === menuId)
                  .map((r) => ({ user_id: r.user_id }));
                return Promise.resolve({ data, error: null });
              },
            };
          },
          upsert: vi.fn(async (rows) => {
            rows.forEach((r) => {
              const idx = state.rows.findIndex(
                (x) => x.menu_id === r.menu_id && x.user_id === r.user_id
              );
              if (idx >= 0) state.rows[idx] = { ...state.rows[idx], ...r };
              else state.rows.push({ ...r });
            });
            return { error: null };
          }),
          delete() {
            return {
              eq(_, menuId) {
                return {
                  in(_, ids) {
                    state.rows = state.rows.filter(
                      (r) => !(r.menu_id === menuId && ids.includes(r.user_id))
                    );
                    return { error: null };
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  it('adds participants', async () => {
    const mock = createMockSupabase();
    await syncMenuParticipants(mock as any, 'm1', [
      { user_id: 'a', weight: 0.3 },
      { user_id: 'b', weight: 0.7 },
    ]);
    expect(mock.state.rows).toEqual([
      { menu_id: 'm1', user_id: 'a', weight: 0.3 },
      { menu_id: 'm1', user_id: 'b', weight: 0.7 },
    ]);
  });

  it('updates weights and removes missing', async () => {
    const mock = createMockSupabase([
      { menu_id: 'm1', user_id: 'a', weight: 0.4 },
      { menu_id: 'm1', user_id: 'b', weight: 0.6 },
    ]);
    await syncMenuParticipants(mock as any, 'm1', [
      { user_id: 'a', weight: 0.5 },
    ]);
    expect(mock.state.rows).toEqual([
      { menu_id: 'm1', user_id: 'a', weight: 0.5 },
    ]);
  });
});
