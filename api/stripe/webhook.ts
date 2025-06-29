import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

let stripeSecret = process.env.STRIPE_SECRET_KEY as string | undefined;
if (!stripeSecret && process.env.NODE_ENV !== 'production') {
  stripeSecret = process.env.VITE_STRIPE_SECRET_KEY;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

const stripe = new Stripe(stripeSecret ?? '', { apiVersion: '2022-11-15' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature', err);
    return res.status(400).send('Invalid signature');
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "invoice.paid":
        const session: any = event.data.object;
        const userId: string | null = session.client_reference_id ?? null;
        const email: string | undefined =
          session.customer_email || session.customer_details?.email;
        let id: string | null = userId;

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        if (!id && email) {
          const { data, error } = await supabase
            .from("public_user_view")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (error) {
            console.error("Error fetching user:", error.message);
          }
          id = (data?.id as string | undefined) ?? null;
        }

        if (id) {
          if (session.mode === 'subscription') {
            const { error } = await supabase.auth.admin.updateUserById(id as string, {
              app_metadata: { subscription_tier: 'premium' },
            });
            if (error) {
              console.error('Supabase update error:', error.message);
              return res.status(500).send('Supabase update failed');
            }
          } else if (session.mode === 'payment' && session.metadata?.credits_type) {
            const column =
              session.metadata.credits_type === 'text' ? 'text_credits' : 'image_credits';
            const increment = session.metadata.credits_type === 'text' ? 150 : 50;
            const { data: row, error: fetchErr } = await supabase
              .from('ia_credits')
              .select(column)
              .eq('user_id', id)
              .maybeSingle<{
                text_credits?: number;
                image_credits?: number;
              }>();
            if (fetchErr) {
              console.error('ia_credits fetch error:', fetchErr.message);
            }
            const current = (row as Record<typeof column, number> | null)?.[column] ?? 0;
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
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).send('Internal server error');
  }

  return res.status(200).send('OK');
}
