import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMenus } from '../hooks/useMenus.js';

let ownerEqCalls = [];
let participantEqCalls = [];
let participantMenuEqCalls = [];
let inCalls = [];

vi.mock('../lib/supabase', () => {
  let weeklyMenuCall = 0;
  function createQuery(data, recordEq, recordIn) {
    const q = { filters: [] };
    q.select = vi.fn(() => q);
    q.eq = vi.fn((col, val) => {
      recordEq && recordEq.push([col, val]);
      q.filters.push([col, val]);
      return q;
    });
    q.order = vi.fn(() => Promise.resolve({ data, error: null }));
    q.in = vi.fn((col, val) => {
      recordIn && recordIn.push([col, val]);
      let result = data;
      q.filters.forEach(([c, v]) => {
        result = result.filter((row) => row[c] === v);
      });
      return Promise.resolve({ data: result, error: null });
    });
    return q;
  }
  const supabase = {
    from: (table) => {
      if (table === 'weekly_menus') {
        weeklyMenuCall += 1;
        if (weeklyMenuCall === 1) {
          return createQuery(
            [{ id: 'm1', user_id: 'user1', name: 'Menu 1', updated_at: 'now', is_shared: false }],
            ownerEqCalls,
            null,
          );
        }
        return createQuery(
          [
            { id: 'm2', user_id: 'user2', name: 'Menu Ami', updated_at: 'now', is_shared: false },
            { id: 'm3', user_id: 'user2', name: 'Menu Ami 2', updated_at: 'now', is_shared: true },
          ],
          participantMenuEqCalls,
          inCalls,
        );
      }
      if (table === 'menu_participants') {
        const q = {};
        q.select = vi.fn(() => q);
        q.eq = vi.fn((col, val) => {
          participantEqCalls.push([col, val]);
          return Promise.resolve({ data: [{ menu_id: 'm2' }, { menu_id: 'm3' }], error: null });
        });
        return q;
      }
      return createQuery([]);
    },
  };
  return { getSupabase: () => supabase };
});

describe('useMenus friend visibility', () => {
  it('includes shared menus from friends', async () => {
    const session = { user: { id: 'user1' } };
    const { result } = renderHook(() => useMenus(session));

    await waitFor(() => result.current.menus.length === 2);

    expect(result.current.menus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'm1', user_id: 'user1' }),
        expect.objectContaining({ id: 'm3', user_id: 'user2', is_shared: true }),
      ]),
    );
    expect(ownerEqCalls).toContainEqual(['user_id', 'user1']);
    expect(participantEqCalls).toContainEqual(['user_id', 'user1']);
    expect(participantMenuEqCalls).toContainEqual(['is_shared', true]);
    expect(inCalls).toContainEqual(['id', ['m2', 'm3']]);
  });
});
