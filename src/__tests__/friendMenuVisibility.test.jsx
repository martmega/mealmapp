import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

let ownerEqCalls = [];
let participantEqCalls = [];
let participantMenuEqCalls = [];
let inCalls = [];
let weeklyMenusData = [];
let participantRowsData = [];

vi.mock('../lib/supabase', () => {
  function applyFilters(data, filters) {
    let result = data;
    filters.forEach(([c, v]) => {
      result = result.filter((row) => row[c] === v);
    });
    return result;
  }

  function createMenusQuery(data) {
    const q = { filters: [] };
    q.select = vi.fn(() => q);
    q.eq = vi.fn((col, val) => {
      if (col === 'user_id') ownerEqCalls.push([col, val]);
      if (col === 'is_shared') participantMenuEqCalls.push([col, val]);
      q.filters.push([col, val]);
      return q;
    });
    q.order = vi.fn(() =>
      Promise.resolve({ data: applyFilters(data, q.filters), error: null })
    );
    q.in = vi.fn((col, val) => {
      inCalls.push([col, val]);
      let result = applyFilters(data, q.filters);
      result = result.filter((row) => val.includes(row[col]));
      return Promise.resolve({ data: result, error: null });
    });
    return q;
  }

  const supabase = {
    from: (table) => {
      if (table === 'weekly_menus') {
        return createMenusQuery(weeklyMenusData);
      }
      if (table === 'menu_participants') {
        const q = {};
        q.select = vi.fn(() => q);
        q.eq = vi.fn((col, val) => {
          participantEqCalls.push([col, val]);
          return Promise.resolve({ data: participantRowsData, error: null });
        });
        return q;
      }
      return createMenusQuery([]);
    },
  };
  return { getSupabase: () => supabase };
});

beforeEach(() => {
  ownerEqCalls = [];
  participantEqCalls = [];
  participantMenuEqCalls = [];
  inCalls = [];
  weeklyMenusData = [];
  participantRowsData = [];
  vi.resetModules();
});

describe('useMenus friend visibility', () => {
  it('includes shared menus from friends', async () => {
    const { useMenus } = await import('../hooks/useMenus.js');
    weeklyMenusData = [
      { id: 'm1', user_id: 'user1', name: 'Menu 1', updated_at: 'now', is_shared: false },
      { id: 'm2', user_id: 'user2', name: 'Menu Ami', updated_at: 'now', is_shared: false },
      { id: 'm3', user_id: 'user2', name: 'Menu Ami 2', updated_at: 'now', is_shared: true },
    ];
    participantRowsData = [{ menu_id: 'm2' }, { menu_id: 'm3' }];
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

  it('ignores menus that are not shared', async () => {
    const { useMenus } = await import('../hooks/useMenus.js');
    weeklyMenusData = [
      { id: 'm1', user_id: 'user1', name: 'Menu 1', updated_at: 'now', is_shared: false },
      { id: 'm2', user_id: 'user2', name: 'Menu Ami', updated_at: 'now', is_shared: false },
    ];
    participantRowsData = [{ menu_id: 'm2' }];
    const session = { user: { id: 'user1' } };
    const { result } = renderHook(() => useMenus(session));

    await waitFor(() => result.current.menus.length === 1);

    expect(result.current.menus).toEqual([
      expect.objectContaining({ id: 'm1', user_id: 'user1' }),
    ]);
    expect(result.current.menus.some((m) => m.id === 'm2')).toBe(false);
    expect(ownerEqCalls).toContainEqual(['user_id', 'user1']);
    expect(participantEqCalls).toContainEqual(['user_id', 'user1']);
    expect(participantMenuEqCalls).toContainEqual(['is_shared', true]);
    expect(inCalls).toContainEqual(['id', ['m2']]);
  });
});
