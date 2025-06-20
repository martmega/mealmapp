import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;

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
            .from('public_users')
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
