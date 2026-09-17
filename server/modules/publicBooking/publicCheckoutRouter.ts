import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { env } from '../../config/environment.ts';
import { publicCheckoutService } from './publicCheckoutService.ts';
import { MercadoPagoPaymentProvider, PicPayPixPaymentProvider } from './paymentProviders.ts';
import { createPaymentProviderRegistry } from './paymentProviders.ts';
import type { CreateCanonicalPaymentRequest } from './publicCheckoutTypes.ts';
import { publicBookingService } from './publicBookingService.ts';

export const publicCheckoutRouter = Router();

/** Deliberately public and non-sensitive. It exposes only combinations which
 * are configured on this runtime, never credentials or provider metadata. */
publicCheckoutRouter.get('/payment-capabilities', (_req: Request, res: Response) => {
  const providers = createPaymentProviderRegistry();
  return res.status(200).json({
    stripe: { card: providers.stripe.isConfigured() && providers.stripe.supports('card') },
    mercadopago: {
      card: providers.mercadopago.isConfigured() && providers.mercadopago.supports('card'),
      pix: providers.mercadopago.isConfigured() && providers.mercadopago.supports('pix'),
    },
    picpay: { pix: providers.picpay.isConfigured() && providers.picpay.supports('pix') },
  });
});

/** Public catalog is resolved exclusively from server-administered mappings. */
publicCheckoutRouter.get('/catalog/:publicPropertyId', async (req: Request, res: Response) => {
  try {
    const publicPropertyId = Array.isArray(req.params.publicPropertyId) ? req.params.publicPropertyId[0] : req.params.publicPropertyId;
    const catalog = await publicBookingService.getPublicCatalog(publicPropertyId);
    return res.status(200).json({ data: catalog });
  } catch (error: any) {
    return res.status(404).json({ error: error?.message || 'Public catalog is unavailable.' });
  }
});

/** Quote calculation deliberately ignores any amount or currency supplied by a browser. */
publicCheckoutRouter.post('/quote', async (req: Request, res: Response) => {
  try {
    const quote = await publicBookingService.quote(req.body || {});
    return res.status(200).json({ data: quote });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Public quote is unavailable.' });
  }
});

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

/** Preferred provider-neutral public checkout boundary. The request contains
 * provider/method presentation input only; the reservation owns all money,
 * currency, tenant and final status facts. */
publicCheckoutRouter.post('/reservations/:reservationId/payments', async (req: Request, res: Response) => {
  try {
    const capability = req.headers['x-checkout-capability'];
    if (typeof capability !== 'string') return res.status(401).json({ error: 'Checkout capability is required.' });
    const idempotencyKey = req.headers['idempotency-key'];
    if (typeof idempotencyKey !== 'string') return res.status(400).json({ error: 'An idempotency key is required.' });
    const reservationId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
    const { provider, method, providerData } = req.body || {};
    if (!['stripe', 'mercadopago', 'picpay'].includes(provider) || !['card', 'pix'].includes(method)) {
      return res.status(400).json({ error: 'Unsupported payment provider or method.' });
    }
    const result = await publicCheckoutService.createPayment(reservationId, capability, { provider, method, providerData } as CreateCanonicalPaymentRequest, idempotencyKey);
    return res.status(201).json({
      paymentId: result.paymentId, provider: result.provider, method: result.paymentMethod,
      status: result.status, presentation: result.presentation,
    });
  } catch (error: any) {
    const message = error?.message || 'Unable to create payment.';
    const status = message === 'PAYMENT_PROVIDER_NOT_CONFIGURED' ? 503 : 400;
    return res.status(status).json({ error: message });
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

export async function mercadoPagoWebhookHandler(req: Request, res: Response) {
  try {
    const provider = new MercadoPagoPaymentProvider();
    const dataId = typeof req.body?.data?.id === 'string' || typeof req.body?.data?.id === 'number'
      ? String(req.body.data.id)
      : (typeof req.body?.resource === 'string' ? req.body.resource.split('/').pop() || '' : '');
    const headers = {
      'x-signature': typeof req.headers['x-signature'] === 'string' ? req.headers['x-signature'] : undefined,
      'x-request-id': typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
    };
    if (!provider.isConfigured()) return res.status(503).json({ error: 'Webhook is not configured.' });
    if (!provider.verifyWebhook(headers, dataId)) return res.status(401).json({ error: 'Invalid Mercado Pago notification.' });
    const eventId = typeof req.body?.id === 'string' || typeof req.body?.id === 'number'
      ? String(req.body.id) : `order:${dataId}:${req.headers['x-request-id'] || ''}`;
    await publicCheckoutService.processProviderWebhook('mercadopago', eventId, dataId);
    return res.status(200).json({ received: true });
  } catch {
    return res.status(400).json({ error: 'Mercado Pago webhook verification failed.' });
  }
}

export async function picPayWebhookHandler(req: Request, res: Response) {
  try {
    const provider = new PicPayPixPaymentProvider();
    const headers = { authorization: typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined };
    if (!provider.isConfigured()) return res.status(503).json({ error: 'Webhook is not configured.' });
    if (!provider.verifyWebhook(headers)) return res.status(401).json({ error: 'Invalid PicPay notification.' });
    const reference = [req.body?.data?.merchantChargeId, req.body?.merchantChargeId, req.body?.referenceId, req.body?.chargeId].find((value) => typeof value === 'string');
    if (typeof reference !== 'string' || !reference) return res.status(400).json({ error: 'PicPay notification is incomplete.' });
    // Some PicPay notifications do not carry a stable event id. The digest
    // creates a server-side replay key without persisting raw callback data.
    const eventId = typeof req.body?.id === 'string' ? req.body.id : createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    await publicCheckoutService.processProviderWebhook('picpay', eventId, reference);
    return res.status(200).json({ received: true });
  } catch {
    return res.status(400).json({ error: 'PicPay webhook verification failed.' });
  }
}
