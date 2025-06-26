import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getUserFromRequest } from '../src/utils/auth.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const TEXT_PRICE_ID = process.env.STRIPE_TEXT_CREDIT_PRICE_ID;
const IMAGE_PRICE_ID = process.env.STRIPE_IMAGE_CREDIT_PRICE_ID;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripeSecret || !TEXT_PRICE_ID || !IMAGE_PRICE_ID) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type } = req.body || {};
  if (type !== 'text' && type !== 'image') {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-04-10' });
  const priceId = type === 'text' ? TEXT_PRICE_ID : IMAGE_PRICE_ID;
  const successUrl = `${req.headers.origin}/app/account?credits_success=true`;
  const cancelUrl = `${req.headers.origin}/app/account?credits_canceled=true`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { credits_type: type },
    });
    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}
