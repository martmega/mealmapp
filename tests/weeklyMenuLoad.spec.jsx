import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeeklyMenu } from '../src/hooks/useWeeklyMenu.js';
import { toDbPrefs } from '../src/lib/menuPreferences.js';
import { initialWeeklyMenuState } from '../src/lib/menu.js';
import { DEFAULT_MENU_PREFS } from '../src/lib/defaultPreferences.js';

vi.mock('../src/lib/supabase', async () => {
  const state = {
    menus: {
      menu1: {
        id: 'menu1',
        user_id: 'user1',
        name: 'Shared Menu',
        menu_data: [],
        is_shared: true,
      },
    },
    preferences: {},
  };

  function menuQuery() {
    const q = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn(() => q);
    q.maybeSingle = vi.fn(() =>
      Promise.resolve({ data: state.menus['menu1'], error: null })
    );
    q.single = vi.fn(() =>
      Promise.resolve({ data: state.menus['menu1'], error: null })
    );
    q.upsert = vi.fn((data) => {
      state.menus[data.id] = data;
      return { select: () => ({ single: () => Promise.resolve({ data, error: null }) }) };
    });
    q.insert = vi.fn((data) => {
      state.menus[data.id] = data;
      return { select: () => ({ single: () => Promise.resolve({ data, error: null }) }) };
    });
    q.update = vi.fn((data) => {
      const chain = {};
      chain.eq = vi.fn(() => chain);
      chain.select = vi.fn(() => chain);
      chain.single = vi.fn(() => {
        state.menus['menu1'] = { ...state.menus['menu1'], ...data };
        return Promise.resolve({ data: state.menus['menu1'], error: null });
      });
      return chain;
    });
    q.delete = vi.fn(() => q);
    return q;
  }

  function prefQuery() {
    const q = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn((col, val) => {
      q.menuId = val;
      return q;
    });
    q.maybeSingle = vi.fn(() => {
      const data = state.preferences[q.menuId];
      return Promise.resolve({ data: data || null, error: null });
    });
    q.insert = vi.fn((data) => {
      state.preferences[data.menu_id] = { ...data };
      return { select: () => ({ single: () => Promise.resolve({ data, error: null }) }) };
    });
    q.upsert = vi.fn((data) => {
      state.preferences[data.menu_id] = { ...data };
      return { select: () => ({ single: () => Promise.resolve({ data, error: null }) }) };
    });
    return q;
  }

  const supabase = {
    from: (table) => {
      if (table === 'weekly_menu_preferences') return prefQuery();
      if (table === 'weekly_menus') return menuQuery();
      return menuQuery();
    },
  };

  global.__supabaseState = state;
  return { getSupabase: () => supabase };
});

beforeEach(() => {
  global.__supabaseState.preferences = {
    menu1: { menu_id: 'menu1', ...toDbPrefs(DEFAULT_MENU_PREFS) },
  };
  global.__supabaseState.menus.menu1 = {
    id: 'menu1',
    user_id: 'user1',
    name: 'Shared Menu',
    menu_data: [],
    is_shared: true,
  };
});

describe('useWeeklyMenu loading', () => {
  it('retains shared status and name when menu_data is empty', async () => {
    const session = { user: { id: 'user1' } };
    const { result } = renderHook(() => useWeeklyMenu(session, 'menu1'));

  await waitFor(() => {
    expect(result.current.menuName).toBe('Shared Menu');
  });

    expect(result.current.weeklyMenu).toEqual(initialWeeklyMenuState());
    expect(result.current.menuName).toBe('Shared Menu');
    expect(result.current.isShared).toBe(true);
  });

  it('retains shared status when menu_data is missing', async () => {
    const session = { user: { id: 'user1' } };
    delete global.__supabaseState.menus.menu1.menu_data;
    const { result } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    await waitFor(() => {
      expect(result.current.menuName).toBe('Shared Menu');
    });

    expect(result.current.weeklyMenu).toEqual(initialWeeklyMenuState());
    expect(result.current.isShared).toBe(true);
  });
});
