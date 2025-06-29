import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

let stripeSecret = process.env.STRIPE_SECRET_KEY as string | undefined;
if (!stripeSecret && process.env.NODE_ENV !== 'production') {
  stripeSecret = process.env.VITE_STRIPE_SECRET_KEY;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY is not defined');
if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string | undefined;
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event: Stripe.Event;
  try {
    const body = await readRawBody(req);
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
      const session: any = event.data.object;
      const userId: string | undefined = session.client_reference_id;
      const email: string | undefined = session.customer_email || session.customer_details?.email;
      let id = userId;

      if (!id && email) {
        const { data, error } = await supabase
          .from('public_user_view')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (error) {
          console.error('Error fetching user:', error.message);
        }
        id = data?.id as string | undefined;
      }

      if (id) {
        if (session.mode === 'subscription') {
          const { error } = await supabase.auth.admin.updateUserById(id, {
            app_metadata: { subscription_tier: 'premium' },
          });
          if (error) {
            console.error('Supabase update error:', error.message);
            return res.status(500).json({ error: 'Supabase update failed' });
          }
        } else if (session.mode === 'payment' && session.metadata?.credits_type) {
          const column = session.metadata.credits_type === 'text' ? 'text_credits' : 'image_credits';
          const increment = session.metadata.credits_type === 'text' ? 150 : 50;
          const { data: row, error: fetchErr } = await supabase
            .from('ia_credits')
            .select(column)
            .eq('user_id', id)
            .maybeSingle();
          if (fetchErr) {
            console.error('ia_credits fetch error:', fetchErr.message);
          }
          const current = row?.[column] ?? 0;
          const { error: upsertErr } = await supabase.from('ia_credits').upsert(
            {
              user_id: id,
              [column]: current + increment,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
          if (upsertErr) {
            console.error('ia_credits upsert error:', upsertErr.message);
          }
        }
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(200).json({ received: true });
}

