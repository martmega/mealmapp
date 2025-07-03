import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockEvent: any;
let creditsRow: any;
let upsertSpy: any;

process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.STRIPE_SECRET_KEY = 'sk_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const constructEvent = vi.fn(() => mockEvent);

vi.mock('stripe', () => {
  return {
    default: class Stripe {
      webhooks = { constructEvent };
    },
  };
});

vi.mock('micro', () => {
  return { buffer: vi.fn(() => Promise.resolve('dummy')) };
});

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => {
      return {
        from(table: string) {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
          };
          if (table === 'ia_credits') {
            chain.maybeSingle = vi.fn(() => Promise.resolve({ data: creditsRow, error: null }));
            chain.upsert = vi.fn((data: any, opts: any) => {
              upsertSpy(data, opts);
              return Promise.resolve({ error: null });
            });
          } else if (table === 'ia_credit_purchases' || table === 'stripe_events') {
            chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
            chain.insert = vi.fn(() => Promise.resolve({ error: null }));
          } else {
            chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
          }
          return chain;
        },
        auth: { admin: { updateUserById: vi.fn() } },
      };
    }),
  };
});

beforeEach(() => {
  creditsRow = { text_credits: 10 };
  upsertSpy = vi.fn();
  mockEvent = {
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'sess_123',
        mode: 'payment',
        metadata: { user_id: 'user_abc', credits_type: 'text', credits_quantity: '5' },
      },
    },
  };
});

describe('stripe webhook handler', () => {
  it('updates credits on payment completion', async () => {
    const { default: handler } = await import('../api/webhooks/stripe.ts');

    const req: any = {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
    };
    const res: any = {
      statusCode: 0,
      body: '',
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(payload: any) {
        this.body = payload;
        return this;
      },
    };

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(upsertSpy).toHaveBeenCalledWith(
      {
        user_id: 'user_abc',
        text_credits: 15,
        updated_at: expect.any(String),
      },
      { onConflict: 'user_id' }
    );
  });
});
