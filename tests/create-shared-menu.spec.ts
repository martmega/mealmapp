import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

let menuInsertSpy: any;
let participantsInsertSpy: any;

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => {
      return {
        from(table: string) {
          const chain: any = {};
          if (table === 'weekly_menus') {
            chain.insert = vi.fn((data: any) => {
              menuInsertSpy(data);
              return {
                select: () => ({
                  single: () =>
                    Promise.resolve({ data: { id: 'menu1', is_shared: data.is_shared }, error: null }),
                }),
              };
            });
          } else if (table === 'menu_participants') {
            chain.insert = vi.fn((rows: any) => {
              participantsInsertSpy(rows);
              return Promise.resolve({ error: null });
            });
          } else {
            chain.insert = vi.fn(() => Promise.resolve({ error: null }));
          }
          chain.select = vi.fn(() => chain);
          chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
          chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
          chain.eq = vi.fn(() => chain);
          return chain;
        },
        auth: { admin: { getUserById: vi.fn(() => Promise.resolve({ data: {}, error: null })) } },
      };
    }),
  };
});

describe('create-shared-menu handler', () => {
  beforeEach(() => {
    menuInsertSpy = vi.fn();
    participantsInsertSpy = vi.fn();
    vi.resetModules();
  });

  it('inserts participants when menu is shared', async () => {
    const { default: handler } = await import('../api/create-shared-menu.ts');
    const req: any = {
      method: 'POST',
      body: {
        user_id: 'user1',
        name: 'Menu',
        menu_data: {},
        participant_ids: ['u2'],
        is_shared: true,
      },
    };
    const res: any = {
      status: vi.fn(() => res),
      json: vi.fn((payload: any) => {
        res.payload = payload;
        return res;
      }),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(menuInsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user1', name: 'Menu', is_shared: true })
    );
    expect(participantsInsertSpy).toHaveBeenCalledWith([
      { menu_id: 'menu1', user_id: 'u2' },
    ]);
  });
});
