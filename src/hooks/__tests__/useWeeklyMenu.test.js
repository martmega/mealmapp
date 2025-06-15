import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useWeeklyMenu } from '../useWeeklyMenu.js';

describe('useWeeklyMenu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads weekly menu from localStorage when no session', () => {
    const saved = Array(7).fill(null).map(() => []);
    saved[0].push([{ id: '1' }]);
    localStorage.setItem('localWeeklyMenu', JSON.stringify(saved));
    const { result } = renderHook(() => useWeeklyMenu(null));
    expect(result.current.weeklyMenu).toEqual(saved);
  });

  it('saves updated weekly menu locally when no session', async () => {
    const { result } = renderHook(() => useWeeklyMenu(null));
    const newMenu = Array(7).fill(null).map(() => []);
    newMenu[0].push([{ id: 'a' }]);
    await act(async () => {
      await result.current.setWeeklyMenu(newMenu);
    });
    const stored = JSON.parse(localStorage.getItem('localWeeklyMenu'));
    expect(stored).toEqual(newMenu);
  });
});
