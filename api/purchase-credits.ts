import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getUserFromRequest } from '../src/utils/auth.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

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

  const { priceId } = req.body || {};
  console.log('[purchase-credits] Received priceId:', priceId);
  if (!/^price_[a-zA-Z0-9]+$/.test(priceId)) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
  const successUrl = `${req.headers.origin}/paiement?success=true`;
  const cancelUrl = `${req.headers.origin}/paiement?cancelled=true`;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
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
