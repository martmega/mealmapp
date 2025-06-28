import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getUserFromRequest } from '../src/utils/auth.js';

const stripeSecret = process.env.VITE_STRIPE_SECRET_KEY as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripeSecret) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { productId } = req.body;
  console.log('[purchase-credits] Payload:', req.body);
  if (!/^price_[a-zA-Z0-9]+$/.test(productId)) {
    return res.status(400).json({ error: 'Invalid product ID format' });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
  const successUrl = `${req.headers.origin}/paiement?success=true`;
  const cancelUrl = `${req.headers.origin}/paiement?cancelled=true`;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: productId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}
