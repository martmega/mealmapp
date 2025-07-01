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
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        const { user_id, credits_type, credits_quantity } = session.metadata || {};
        console.log('Stripe session metadata:', session.metadata);

        if (!user_id || !credits_type || !credits_quantity) {
          console.error('Missing Stripe metadata');
          return new Response('Missing metadata', { status: 400 });
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        const { data: existingEvent, error: eventCheckErr } = await supabase
          .from('stripe_events')
          .select('event_id')
          .eq('event_id', event.id)
          .maybeSingle();

        if (eventCheckErr) {
          console.error('stripe_events fetch error:', eventCheckErr.message);
        }

        if (existingEvent) {
          console.log('Stripe event already handled:', event.id);
          return new Response('OK');
        }

        const column = credits_type === 'text' ? 'text_credits' : 'image_credits';
        const increment = Number(credits_quantity) || 0;

        const { data: creditRow, error: fetchErr } = await supabase
          .from('ia_credits')
          .select('text_credits, image_credits')
          .eq('user_id', user_id)
          .maybeSingle<{ text_credits?: number; image_credits?: number }>();
        if (fetchErr) {
          console.error('ia_credits fetch error:', fetchErr.message);
        }

        const updated = {
          user_id,
          text_credits: creditRow?.text_credits ?? 0,
          image_credits: creditRow?.image_credits ?? 0,
          updated_at: new Date().toISOString(),
        } as { user_id: string; text_credits: number; image_credits: number; updated_at: string };
        updated[column] = (creditRow?.[column as 'text_credits' | 'image_credits'] ?? 0) + increment;

        const { error: upsertErr } = await supabase
          .from('ia_credits')
          .upsert(updated, { onConflict: 'user_id' });
        if (upsertErr) {
          console.error('ia_credits upsert error:', upsertErr.message);
        }

        const { error: purchaseErr } = await supabase.from('ia_credit_purchases').insert({
          user_id,
          stripe_session_id: session.id,
          credits_type,
          credits_amount: increment,
        });
        if (purchaseErr) {
          console.error('ia_credit_purchases insert error:', purchaseErr.message);
        }

        const { error: eventInsertErr } = await supabase
          .from('stripe_events')
          .insert({ event_id: event.id });
        if (eventInsertErr) {
          console.error('stripe_events insert error:', eventInsertErr.message);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response('Internal server error', { status: 500 });
  }

  return new Response('OK');
}
