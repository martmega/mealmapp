import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.OPENAI_API_KEY = 'test-key';

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => {
      return {
        from(table: string) {
          if (table === 'public_user_view') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn(() =>
                Promise.resolve({ data: { subscription_tier: 'vip' }, error: null })
              ),
            } as any;
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) } as any;
        },
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
      } as any;
    }),
  };
});

vi.mock('../src/utils/auth.js', () => ({
  getUserFromRequest: vi.fn(() => Promise.resolve({ id: 'user_1' })),
}));

class MockOpenAI {
  chat = {
    completions: {
      create: vi.fn(() => Promise.resolve({ choices: [{ message: { content: '8.50' } }] })),
    },
  };
}

vi.mock('openai', () => ({ default: MockOpenAI }));

describe('AI cost handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows vip tier for cost estimation', async () => {
    const { default: handler } = await import('../api/ai.ts');
    const req: any = {
      method: 'POST',
      query: { action: 'cost' },
      body: { recipe: { name: 'Cake', servings: 2, ingredients: [{ quantity: '1', name: 'flour' }] } },
    };
    const res: any = {
      statusCode: 0,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        this.body = payload;
        return this;
      },
    };

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ price: 8.5 });
  });
});
