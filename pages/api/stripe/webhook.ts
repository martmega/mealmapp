import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey)
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    const buf = await readBuffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'invoice.paid'
  ) {
    try {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const email = session.customer_email || session.customer_details?.email;
      if (userId || email) {
        let id = userId;
        if (!id && email) {
          const { data } = await supabase
            .from('public_user_view')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          id = data?.id;
        }
        if (id) {
          await supabase.auth.admin.updateUserById(id, {
            app_metadata: { subscription_tier: 'premium' },
          });
        }
      }
    } catch (err) {
      console.error('Stripe webhook error:', err);
    }
  }

  res.status(200).json({ received: true });
}
