import { RequestHandler } from 'express';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const stripeKey = process.env.NODE_ENV === 'production'
  ? process.env.VITE_STRIPE_LIVE_KEY
  : process.env.VITE_STRIPE_TEST_KEY;

if (!stripeKey) {
  throw new Error('Stripe API key is not configured');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-11-20.acacia'
});

export const getStripePayments: RequestHandler = async (req, res) => {
  const userId = req.headers.authorization?.replace('Bearer ', '');

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payments = await stripe.charges.list({
      customer: userId,
      limit: 100
    });

    res.json({
      payments: payments.data.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        created: payment.created,
        receipt_url: payment.receipt_url
      }))
    });
  } catch (error) {
    console.error('Error fetching Stripe payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
}; 