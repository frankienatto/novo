import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/environment.ts';
import { publicCheckoutService } from './publicCheckoutService.ts';

export const publicCheckoutRouter = Router();

publicCheckoutRouter.post('/reservations', async (req: Request, res: Response) => {
  try {
    const result = await publicCheckoutService.createReservation(req.body);
    return res.status(201).json({ reservationId: result.reservation.reservationId, checkoutCapability: result.checkoutCapability, totalAmount: result.reservation.totalAmount, currency: result.reservation.currency, paymentStatus: result.reservation.paymentStatus });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Unable to create reservation.' });
  }
});

publicCheckoutRouter.post('/reservations/:reservationId/payment-intent', async (req: Request, res: Response) => {
  try {
    if (!env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Payments are not configured.' });
    const capability = req.headers['x-checkout-capability'];
    if (typeof capability !== 'string') return res.status(401).json({ error: 'Checkout capability is required.' });
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const reservationId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
    const result = await publicCheckoutService.createPaymentIntent(reservationId, capability, stripe);
    return res.status(200).json({ clientSecret: result.clientSecret, paymentIntentId: result.stripePaymentIntentId });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Unable to create payment intent.' });
  }
});

export async function stripeWebhookHandler(req: Request, res: Response) {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook is not configured.' });
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Invalid Stripe webhook request.' });
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    await publicCheckoutService.processStripeEvent(event);
    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(400).json({ error: 'Stripe webhook verification failed.' });
  }
}
