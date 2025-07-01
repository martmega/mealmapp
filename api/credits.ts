import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getUserFromRequest } from '../src/utils/auth.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

let stripeSecret: string | undefined = process.env.STRIPE_SECRET_KEY as string | undefined;
if (!stripeSecret && process.env.NODE_ENV !== 'production') {
  stripeSecret = process.env.VITE_STRIPE_SECRET_KEY;
}
if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY in environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      const { data: usage, error: usageError } = await supabaseAdmin
        .from('ia_usage')
        .select('text_requests, image_requests')
        .eq('user_id', user.id)
        .eq('month', month)
        .maybeSingle();

      if (usageError) {
        console.error('ia_usage fetch error:', usageError.message);
      }

      const { data: credits, error: creditErr } = await supabaseAdmin
        .from('ia_credits')
        .select('text_credits, image_credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditErr) {
        console.error('ia_credits fetch error:', creditErr.message);
      }

      return res.status(200).json({
        ia_usage: {
          text_requests: usage?.text_requests ?? 0,
          image_requests: usage?.image_requests ?? 0,
        },
        ia_credits: {
          text_credits: credits?.text_credits ?? 0,
          image_credits: credits?.image_credits ?? 0,
        },
      });
    } catch (err) {
      console.error('credits GET error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {

    const { productId, creditsType } = req.body || {};
    console.log('[credits] purchase payload:', req.body);
    if (!/^price_[a-zA-Z0-9]+$/.test(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const creditType: 'text' | 'image' = creditsType === 'text' ? 'text' : 'image';
    const creditQuantity = creditType === 'text' ? 150 : 50;

    const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
    const successUrl = `${req.headers.origin}/paiement?credits_success=true`;
    const cancelUrl = `${req.headers.origin}/paiement?credits_canceled=true`;

    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: productId, quantity: 1 }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: user.id,
        metadata: {
          user_id: user.id,
          product_id: productId,
          credits_type: creditType,
          credits_quantity: creditQuantity,
        },
      });
      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Stripe session error:', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
