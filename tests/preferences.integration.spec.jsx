import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import MenuPreferencesPanel from '../src/components/menu_planner/MenuPreferencesPanel.jsx';
import { useWeeklyMenu, toDbPrefs } from '../src/hooks/useWeeklyMenu.js';
import { DEFAULT_MENU_PREFS } from '../src/lib/defaultPreferences.js';

global.scrollTo = vi.fn();

vi.mock('../src/lib/supabase', async () => {
  const state = {
    menus: {
      menu1: { id: 'menu1', user_id: 'user1', name: 'Menu', menu_data: [], is_shared: false },
    },
    preferences: {},
    lastUpsert: null,
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
      state.pendingUpdate = data;
      const chain = {
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(() => {
          state.menus['menu1'] = { ...state.menus['menu1'], ...data };
          return Promise.resolve({ data: state.menus['menu1'], error: null });
        }),
      };
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
      state.lastUpsert = data;
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
  global.__supabaseState.lastUpsert = null;
});

describe('MenuPreferencesPanel', () => {
  it('calls updatePreferences when fields change', () => {
    const prefs = { ...DEFAULT_MENU_PREFS };
    const updateSpy = vi.fn();
    const { getByLabelText } = render(
      <MenuPreferencesPanel
        preferences={prefs}
        setPreferences={updateSpy}
        availableTags={[]}
        userProfile={{ id: 'user1', username: 'User1' }}
        isShared={false}
      />
    );

    fireEvent.change(getByLabelText(/Portions par repas/), { target: { value: '6' } });
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useWeeklyMenu.updateMenuPreferences', () => {
  it('upserts all preference fields', async () => {
    const session = { user: { id: 'user1' } };
    const { result } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    const newPrefs = {
      servingsPerMeal: 5,
      maxCalories: 1800,
      weeklyBudget: 50,
      meals: [{ id: 1, enabled: true, mealNumber: 1, types: ['plat'] }],
      tagPreferences: ['bio'],
      commonMenuSettings: {},
    };

    await act(async () => {
      await result.current.updatePreferences(newPrefs);
    });

    const actual = { ...global.__supabaseState.lastUpsert };
    const expectedDb = toDbPrefs(newPrefs);
    ['daily_meal_structure', 'tag_preferences', 'common_menu_settings'].forEach(
      (f) => {
        actual[f] = JSON.parse(actual[f]);
        expectedDb[f] = JSON.parse(expectedDb[f]);
      }
    );
    expect(actual).toEqual({ menu_id: 'menu1', ...expectedDb });
  });

  it('merges with existing preferences for partial updates', async () => {
    const session = { user: { id: 'user1' } };
    const { result } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    await act(async () => {
      await result.current.updatePreferences({ weeklyBudget: 40 });
    });

    const expected = { ...DEFAULT_MENU_PREFS, weeklyBudget: 40 };
    const expectedDb = toDbPrefs({ ...expected, commonMenuSettings: {} });

    const actual = { ...global.__supabaseState.lastUpsert };
    ['daily_meal_structure', 'tag_preferences', 'common_menu_settings'].forEach(
      (f) => {
        actual[f] = JSON.parse(actual[f]);
        expectedDb[f] = JSON.parse(expectedDb[f]);
      }
    );
    expect(actual).toEqual({ menu_id: 'menu1', ...expectedDb });
    expect(result.current.preferences).toEqual(expected);
  });
});

describe('preferences integration', () => {
  it('reloads updated preferences', async () => {
    const session = { user: { id: 'user1' } };
    const { result, unmount } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    const updated = {
      servingsPerMeal: 3,
      maxCalories: 1700,
      weeklyBudget: 25,
      meals: [],
      tagPreferences: [],
      commonMenuSettings: {},
    };

    await act(async () => {
      await result.current.updatePreferences(updated);
    });

    unmount();

    const { result: result2 } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    await waitFor(() => {
      expect(result2.current.preferences).toEqual({
        ...updated,
        commonMenuSettings: { enabled: false, linkedUsers: [], linkedUserRecipes: [] },
      });
    });
  });

  it('reloads merged preferences after partial update', async () => {
    const session = { user: { id: 'user1' } };
    const { result, unmount } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    await act(async () => {
      await result.current.updatePreferences({ servingsPerMeal: 6 });
    });

    unmount();

    const { result: result2 } = renderHook(() => useWeeklyMenu(session, 'menu1'));

    await waitFor(() => {
      expect(result2.current.preferences).toEqual({
        ...DEFAULT_MENU_PREFS,
        servingsPerMeal: 6,
      });
    });
  });
});


