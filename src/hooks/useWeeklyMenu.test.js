import { act, renderHook, waitFor } from '@testing-library/react';
import { useWeeklyMenu } from './useWeeklyMenu';

vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

beforeEach(() => {
  localStorage.clear();
});

describe('useWeeklyMenu', () => {
  it('initializes with seven days', () => {
    const { result } = renderHook(() => useWeeklyMenu(null));
    expect(result.current.weeklyMenu).toHaveLength(7);
  });

  it('persists weekly menu locally', async () => {
    const { result } = renderHook(() => useWeeklyMenu(null));
    const newMenu = Array(7).fill([]);

    await act(async () => {
      await result.current.setWeeklyMenu(newMenu);
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('localWeeklyMenu'));
      expect(stored).toEqual(newMenu);
    });
  });
});
