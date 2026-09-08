import express from 'express';
import { createServer } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';

const mocks = vi.hoisted(() => ({ processStripeEvent: vi.fn() }));
vi.mock('../../config/environment.ts', () => ({
  env: { STRIPE_SECRET_KEY: 'sk_test_http_only', STRIPE_WEBHOOK_SECRET: 'whsec_http_only' },
}));
vi.mock('./publicCheckoutService.ts', () => ({
  publicCheckoutService: { processStripeEvent: mocks.processStripeEvent },
}));

import { stripeWebhookHandler } from './publicCheckoutRouter.ts';

const secret = 'whsec_http_only';
const stripe = new Stripe('sk_test_http_only');

async function request(body: string, signature?: string) {
  const app = express();
  // This is the exact ordering used by server.ts at runtime.
  app.post('/api/public-booking/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
  app.use(express.json());
  app.post('/json', (req, res) => res.json({ received: req.body }));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to start HTTP test server.');
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/public-booking/stripe/webhook`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) }, body,
    });
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}

afterEach(() => mocks.processStripeEvent.mockReset());

describe('Stripe webhook HTTP raw-body integration', () => {
  const payload = JSON.stringify({ id: 'evt_http_valid', type: 'payment_intent.succeeded', data: { object: { id: 'pi_http' } } });

  it('accepts a Stripe-signed raw HTTP payload before express.json()', async () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const response = await request(payload, signature);
    expect(response.status).toBe(200);
    expect(mocks.processStripeEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt_http_valid' }));
  });

  it('rejects an altered body signed for a different payload', async () => {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const response = await request(`${payload} `, signature);
    expect(response.status).toBe(400);
    expect(mocks.processStripeEvent).not.toHaveBeenCalled();
  });

  it('rejects invalid and missing signatures without processing an event', async () => {
    expect((await request(payload, 't=1,v1=invalid')).status).toBe(400);
    expect((await request(payload)).status).toBe(400);
    expect(mocks.processStripeEvent).not.toHaveBeenCalled();
  });

  it('keeps normal JSON parsing available after the webhook raw route', async () => {
    const app = express();
    app.post('/api/public-booking/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
    app.use(express.json());
    app.post('/json', (req, res) => res.json({ received: req.body }));
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as import('node:net').AddressInfo;
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/json`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ normal: true }) });
      await expect(response.json()).resolves.toEqual({ received: { normal: true } });
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
