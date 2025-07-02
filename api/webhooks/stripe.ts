import { VercelRequest, VercelResponse } from '@vercel/node';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

let stripeSecret = process.env.STRIPE_SECRET_KEY as string | undefined;
if (!stripeSecret && process.env.NODE_ENV !== 'production') {
  stripeSecret = process.env.VITE_STRIPE_SECRET_KEY;
}
if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY in environment variables');
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

  const sig = req.headers['stripe-signature'] as string | undefined;
  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig ?? '', webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature', err);
    return res.status(400).send('Invalid signature');
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  try {
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object;
      const userId: string | undefined = session.metadata?.user_id;
      if (!userId) {
        console.error('❌ Missing metadata', session.metadata);
        return res.status(400).send('Missing metadata');
      }

      console.log('✅ Webhook reçu pour user_id:', userId);
      console.log('📦 Metadata:', session.metadata);

      const { data: existingEvent, error: existingEventError } = await supabase
        .from('stripe_events')
        .select('event_id')
        .eq('event_id', event.id)
        .maybeSingle();

      if (existingEventError) {
        console.error('❌ Erreur sur select stripe_events:', existingEventError);
      }

      if (existingEvent) {
        console.log('⚠️ Stripe event déjà traité:', event.id);
        return res.status(200).send('OK');
      }

      const creditAmount = Number(session.metadata?.credits_quantity || 0);
      const creditType = session.metadata?.credits_type === 'image' ? 'image' : 'text';
      const column = creditType === 'text' ? 'text_credits' : 'image_credits';

      const { data: row, error: selectError } = await supabase
        .from('ia_credits')
        .select(column)
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) {
        console.error('❌ Erreur sur select ia_credits:', selectError);
      }

      const current = (row as Record<typeof column, number> | null)?.[column] ?? 0;

      const { error: upsertError } = await supabase.from('ia_credits').upsert(
        { user_id: userId, [column]: current + creditAmount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

      if (upsertError) {
        console.error('❌ Erreur sur upsert ia_credits:', upsertError);
      }

      await supabase.from('stripe_events').insert({ event_id: event.id });
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('❌ Webhook processing error:', err);
    return res.status(500).send('Internal server error');
  }

  return res.status(200).send('OK');
}
