import express from 'express';
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createPayment: vi.fn(), processProviderWebhook: vi.fn(),
}));

vi.mock('../../config/environment.ts', () => ({
  env: { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined },
}));
vi.mock('./publicCheckoutService.ts', () => ({
  publicCheckoutService: {
    createPayment: mocks.createPayment,
    processProviderWebhook: mocks.processProviderWebhook,
    processStripeEvent: vi.fn(),
  },
}));

import { publicCheckoutRouter, mercadoPagoWebhookHandler, picPayWebhookHandler } from './publicCheckoutRouter.ts';

const app = () => {
  const server = express();
  server.use(express.json());
  server.use('/api/public-booking', publicCheckoutRouter);
  server.post('/api/payments/mercadopago/webhook', mercadoPagoWebhookHandler);
  server.post('/api/payments/picpay/webhook', picPayWebhookHandler);
  return server;
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.MERCADOPAGO_ACCESS_TOKEN; delete process.env.MERCADOPAGO_WEBHOOK_SECRET; delete process.env.PAYMENTS_PUBLIC_BASE_URL;
  delete process.env.PICPAY_CLIENT_ID; delete process.env.PICPAY_CLIENT_SECRET; delete process.env.PICPAY_WEBHOOK_TOKEN;
});
afterEach(() => vi.unstubAllEnvs());

describe('provider-neutral payment HTTP boundaries', () => {
  it('returns only non-sensitive unavailable capabilities and rejects missing checkout authorization', async () => {
    mocks.createPayment.mockResolvedValue({ paymentId: 'pay_1', provider: 'picpay', paymentMethod: 'pix', status: 'pending', presentation: { qrCode: 'pix' } });
    const server = app();
    const [capabilities, missing] = await new Promise<Response[]>((resolve) => {
      const http = server.listen(0, async () => { const port = (http.address() as any).port; resolve(await Promise.all([
        fetch(`http://127.0.0.1:${port}/api/public-booking/payment-capabilities`),
        fetch(`http://127.0.0.1:${port}/api/public-booking/reservations/res_1/payments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'picpay', method: 'pix' }) }),
      ])); http.close(); });
    });
    await expect(capabilities.json()).resolves.toEqual({ stripe: { card: false }, mercadopago: { card: false, pix: false }, picpay: { pix: false } });
    expect(missing.status).toBe(401);
  });

  it('validates Mercado Pago HMAC before invoking provider reconciliation', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'token'; process.env.MERCADOPAGO_WEBHOOK_SECRET = 'secret'; process.env.PAYMENTS_PUBLIC_BASE_URL = 'https://staging.example.test';
    const dataId = '123'; const requestId = 'request-1'; const ts = '1700000000';
    const signature = createHmac('sha256', 'secret').update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');
    mocks.processProviderWebhook.mockResolvedValue({ replay: false });
    const server = app();
    const response = await new Promise<Response>((resolve) => { const http = server.listen(0, async () => { const port = (http.address() as any).port; resolve(await fetch(`http://127.0.0.1:${port}/api/payments/mercadopago/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${signature}` }, body: JSON.stringify({ id: 'event-1', data: { id: dataId } }) })); http.close(); }); });
    expect(response.status).toBe(200);
    expect(mocks.processProviderWebhook).toHaveBeenCalledWith('mercadopago', 'event-1', dataId);
  });

  it('creates an authorized provider-neutral payment and accepts a verified PicPay callback', async () => {
    mocks.createPayment.mockResolvedValue({ paymentId: 'pay_2', provider: 'picpay', paymentMethod: 'pix', status: 'pending', presentation: { qrCode: 'pix' } });
    mocks.processProviderWebhook.mockResolvedValueOnce({ replay: false }).mockResolvedValueOnce({ replay: true });
    process.env.PICPAY_CLIENT_ID = 'client'; process.env.PICPAY_CLIENT_SECRET = 'secret'; process.env.PICPAY_WEBHOOK_TOKEN = 'callback';
    const server = app();
    const responses = await new Promise<Response[]>((resolve) => { const http = server.listen(0, async () => { const port = (http.address() as any).port;
      const create = await fetch(`http://127.0.0.1:${port}/api/public-booking/reservations/res_1/payments`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-checkout-capability': 'capability', 'idempotency-key': 'payment-http-attempt-0001' }, body: JSON.stringify({ provider: 'picpay', method: 'pix' }) });
      const callback = await fetch(`http://127.0.0.1:${port}/api/payments/picpay/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'callback' }, body: JSON.stringify({ id: 'picpay-event-1', data: { merchantChargeId: 'charge-1' } }) });
      resolve([create, callback]); http.close(); }); });
    expect(responses.map(response => response.status)).toEqual([201, 200]);
    expect(mocks.createPayment).toHaveBeenCalledWith('res_1', 'capability', expect.objectContaining({ provider: 'picpay', method: 'pix' }), 'payment-http-attempt-0001');
    expect(mocks.processProviderWebhook).toHaveBeenCalledWith('picpay', 'picpay-event-1', 'charge-1');
  });

  it('rejects invalid Mercado Pago signatures and PicPay callback tokens', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'token'; process.env.MERCADOPAGO_WEBHOOK_SECRET = 'secret'; process.env.PAYMENTS_PUBLIC_BASE_URL = 'https://staging.example.test';
    process.env.PICPAY_CLIENT_ID = 'client'; process.env.PICPAY_CLIENT_SECRET = 'secret'; process.env.PICPAY_WEBHOOK_TOKEN = 'callback';
    const server = app();
    const responses = await new Promise<Response[]>((resolve) => { const http = server.listen(0, async () => { const port = (http.address() as any).port;
      resolve(await Promise.all([
        fetch(`http://127.0.0.1:${port}/api/payments/mercadopago/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-signature': 'ts=1,v1=bad' }, body: JSON.stringify({ data: { id: '123' } }) }),
        fetch(`http://127.0.0.1:${port}/api/payments/picpay/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'wrong' }, body: JSON.stringify({ id: 'event', data: { merchantChargeId: 'charge' } }) }),
      ])); http.close(); }); });
    expect(responses.map(response => response.status)).toEqual([401, 401]);
    expect(mocks.processProviderWebhook).not.toHaveBeenCalled();
  });
});
