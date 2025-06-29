export const config = { runtime: 'edge' };

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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "invoice.paid":
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        const { data: existingEvent, error: existingErr } = await supabase
          .from('stripe_events')
          .select('event_id')
          .eq('event_id', event.id)
          .maybeSingle();
        if (existingErr) {
          console.error('stripe_events fetch error:', existingErr.message);
        }
        if (existingEvent) {
          console.log('Stripe event already processed:', event.id);
          break;
        }

        const session: any = event.data.object;
        const userId: string | null = session.client_reference_id ?? null;
        const email: string | undefined =
          session.customer_email || session.customer_details?.email;
        let id: string | null = userId;

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
              return new Response('Supabase update failed', { status: 500 });
            }
          } else if (session.mode === 'payment' && session.metadata?.credits_type) {
            const column =
              session.metadata.credits_type === 'text' ? 'text_credits' : 'image_credits';
            let increment = 0;
            try {
              const detailedSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items.data.price.product'],
              });
              const lineItem = (detailedSession as any).line_items?.data?.[0];
              const meta = lineItem?.price?.metadata || lineItem?.price?.product?.metadata;
              const amount = parseInt(meta?.credit_amount ?? '0', 10);
              if (!Number.isNaN(amount)) increment = amount;
            } catch (err) {
              console.error('Failed to load credit metadata:', err);
            }
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

          const { error: insertErr } = await supabase
            .from('stripe_events')
            .insert({ event_id: event.id });
          if (insertErr) {
            console.error('stripe_events insert error:', insertErr.message);
          }
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response('Internal server error', { status: 500 });
  }

  return new Response('OK');
}
