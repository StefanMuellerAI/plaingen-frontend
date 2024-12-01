import express from 'express';
import cors from 'cors';
import { handleStripeWebhook } from './api/stripe-webhook.js';
import { getStripePayments } from './api/stripe-payments.js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.VITE_STRIPE_LIVE_KEY 
  : process.env.VITE_STRIPE_TEST_KEY;

const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2024-11-20.acacia'
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://easiergen.com' 
    : 'http://localhost:5173'
}));

// Stripe Webhook Route
app.post(
  '/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).json({ error: 'Missing signature or webhook secret' });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
      
      const result = await handleStripeWebhook(event);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).json({ error: err.message });
    }
  }
);

// JSON Parser für andere Routen
app.use(express.json());

// Stripe Payments Route
app.get('/api/stripe-payments', getStripePayments);

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 