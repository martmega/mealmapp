import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

let insertedMenus: any[];
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
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({ data: { id: menuId, is_shared: data.is_shared }, error: null }),
                }),
              };
            },
          };
        }
        if (table === 'weekly_menu_preferences') {
          return {
            insert() {
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: {}, error: null }),
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
    expect(menuInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ is_shared: true })
    );
  });

  it('inserts default prefs for non shared menu', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = { method: 'POST', body: { user_id: 'u1', name: 'Private', is_shared: false } };
    const res: any = { status(code: number) { this.statusCode = code; return this; }, json(payload: any) { this.body = payload; return this; } };
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(menuInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ is_shared: false })
    );
  });

  it('inserts participants when menu is shared', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = {
      method: 'POST',
      body: {
        user_id: 'u1',
        name: 'Shared',
        is_shared: true,
        participant_ids: ['u2', 'u3'],
      },
    };
    const res: any = { status() { return this; }, json() { return this; } };
    await handler(req, res);

    expect(participantInsertSpy).toHaveBeenCalledWith([
      { menu_id: 'm1', user_id: 'u2' },
      { menu_id: 'm1', user_id: 'u3' },
    ]);
  });

  it('filters out creator and falsy IDs', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = {
      method: 'POST',
      body: {
        user_id: 'u1',
        name: 'Shared',
        is_shared: true,
        participant_ids: ['u1', 'u2', null, undefined, '', 'u3'],
      },
    };
    const res: any = { status() { return this; }, json() { return this; } };
    await handler(req, res);

    expect(participantInsertSpy).toHaveBeenCalledWith([
      { menu_id: 'm1', user_id: 'u2' },
      { menu_id: 'm1', user_id: 'u3' },
    ]);
  });
});
