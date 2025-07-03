import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

let insertedMenus: any[];
let insertedPrefs: any[];
let menuInsertSpy: any;
let participantInsertSpy: any;

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from(table: string) {
        if (table === 'weekly_menus') {
          return {
            insert(data: any) {
              menuInsertSpy(data);
              const menuId = `m${insertedMenus.length + 1}`;
              insertedMenus.push({ ...data, id: menuId });
              const pref = {
                menu_id: menuId,
                portions_per_meal: 4,
                daily_calories_limit: 2200,
                weekly_budget: 35,
                daily_meal_structure: [],
                tag_preferences: [],
                common_menu_settings: data.is_shared
                  ? { enabled: false, linkedUsers: [], linkedUserRecipes: [] }
                  : {},
              };
              insertedPrefs.push(pref);
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({ data: { id: menuId, is_shared: data.is_shared }, error: null }),
                }),
              };
            },
          };
        }
        if (table === 'menu_participants') {
          return { insert: participantInsertSpy };
        }
        return {};
      },
      auth: { admin: { getUserById: vi.fn(() => ({ data: {}, error: null })) } },
    })),
  };
});

beforeEach(() => {
  insertedMenus = [];
  insertedPrefs = [];
  menuInsertSpy = vi.fn(() => Promise.resolve({ error: null }));
  participantInsertSpy = vi.fn(() => Promise.resolve({ error: null }));
});

describe('create-shared-menu trigger', () => {
  it('inserts default prefs for shared menu', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = { method: 'POST', body: { user_id: 'u1', name: 'Shared', is_shared: true } };
    const res: any = { status(code: number) { this.statusCode = code; return this; }, json(payload: any) { this.body = payload; return this; } };
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(menuInsertSpy).toHaveBeenCalledWith(expect.objectContaining({ is_shared: true }));
    expect(insertedPrefs[0].common_menu_settings).toEqual({ enabled: false, linkedUsers: [], linkedUserRecipes: [] });
  });

  it('inserts default prefs for non shared menu', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = { method: 'POST', body: { user_id: 'u1', name: 'Private', is_shared: false } };
    const res: any = { status(code: number) { this.statusCode = code; return this; }, json(payload: any) { this.body = payload; return this; } };
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(menuInsertSpy).toHaveBeenCalledWith(expect.objectContaining({ is_shared: false }));
    expect(insertedPrefs[0].common_menu_settings).toEqual({});
  });
});
