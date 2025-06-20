import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    console.error('Invalid Stripe signature:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const email = session.customer_email || session.customer_details?.email;
        let id = userId;

        if (!id && email) {
          const { data, error } = await supabase
            .from('public_users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          if (error) {
            console.error('Error fetching user:', error.message);
          }
          id = data?.id;
        }

        if (id) {
          const { error } = await supabase.auth.admin.updateUserById(id, {
            app_metadata: { subscription_tier: 'premium' },
          });
          if (error) {
            console.error('Supabase update error:', error.message);
            return res.status(500).json({ error: 'Supabase update failed' });
          }
        }
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  res.status(200).json({ received: true });
}
