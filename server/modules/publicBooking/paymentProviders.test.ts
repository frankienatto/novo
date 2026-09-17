import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MercadoPagoPaymentProvider, PicPayPixPaymentProvider } from './paymentProviders.ts';

const reservation: any = {
  reservationId: 'res_payment_test', organizationId: 'org_a', propertyId: 'prop_a',
  guest: { fullName: 'Guest Test', email: 'guest@example.test' },
};

afterEach(() => vi.unstubAllGlobals());

describe('canonical payment provider adapters', () => {
  it('creates Mercado Pago card and Pix orders with server-derived amount and idempotency', async () => {
    const requests: any[] = [];
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string, init: any) => {
      urls.push(url);
      requests.push(JSON.parse(init.body));
      return {
        ok: true,
        json: async () => ({
          id: 123456,
          status: 'action_required',
          order_status: 'action_required',
          transactions: {
            payments: [
              {
                id: 987654,
                status: 'pending',
                point_of_interaction: {
                  transaction_data: { qr_code: 'pix-code-orders', qr_code_base64: 'base64-orders' },
                },
              },
            ],
          },
        }),
      };
    });
    const provider = new MercadoPagoPaymentProvider('access', 'webhook', 'https://staging.example.test');
    await provider.createPayment({ paymentId: 'payment_card', amount: 123.45, currency: 'brl', reservation, method: 'card', providerData: { token: 'tokenized-card' } });
    const pix = await provider.createPayment({ paymentId: 'payment_pix', amount: 123.45, currency: 'brl', reservation, method: 'pix' });

    expect(urls[0]).toBe('https://api.mercadopago.com/v1/orders');
    expect(urls[1]).toBe('https://api.mercadopago.com/v1/orders');
    expect(requests[0]).toMatchObject({
      type: 'online',
      processing_mode: 'automatic',
      total_amount: 123.45,
      external_reference: 'payment_card',
      transactions: {
        payments: [{ amount: 123.45, token: 'tokenized-card' }],
      },
    });
    expect(requests[1]).toMatchObject({
      type: 'online',
      processing_mode: 'automatic',
      total_amount: 123.45,
      external_reference: 'payment_pix',
      transactions: {
        payments: [{ amount: 123.45, payment_method: { id: 'pix', type: 'bank_transfer' } }],
      },
    });
    expect(pix.providerPaymentId).toBe('123456');
    expect(pix.presentation).toMatchObject({ qrCode: 'pix-code-orders', qrCodeBase64: 'base64-orders' });
  });

  it('fails safely when Mercado Pago does not return valid Pix QR data', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      json: async () => ({ id: 123, status: 'opened', transactions: [] }),
    }));
    const provider = new MercadoPagoPaymentProvider('access', 'webhook', 'https://staging.example.test');
    await expect(provider.createPayment({ paymentId: 'pay_fail', amount: 100, currency: 'brl', reservation, method: 'pix' }))
      .rejects.toThrow('PAYMENT_PROVIDER_INVALID_PIX_RESPONSE');
  });

  it('retrieves Mercado Pago order status and maps paid and pending states strictly', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      if (url.includes('order_paid')) {
        return {
          ok: true,
          json: async () => ({
            id: 'order_paid',
            order_status: 'processed',
            total_amount: 250,
            currency_id: 'BRL',
            transactions: { payments: [{ status: 'approved', amount: 250 }] },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          id: 'order_pending',
          order_status: 'action_required',
          total_amount: 250,
          currency_id: 'BRL',
          transactions: { payments: [{ status: 'pending', amount: 250 }] },
        }),
      };
    });
    const provider = new MercadoPagoPaymentProvider('access', 'webhook', 'https://staging.example.test');
    const paidStatus = await provider.getPaymentStatus('order_paid');
    expect(urls[0]).toBe('https://api.mercadopago.com/v1/orders/order_paid');
    expect(paidStatus).toMatchObject({ paid: true, failed: false, amount: 250, currency: 'brl' });

    const pendingStatus = await provider.getPaymentStatus('order_pending');
    expect(pendingStatus).toMatchObject({ paid: false, failed: false, amount: 250, currency: 'brl' });
  });

  it('authenticates Mercado Pago signed notifications and rejects modified signatures', () => {
    const secret = 'mp_webhook_test_secret'; const dataId = '123'; const requestId = 'request-a'; const ts = '1700000000';
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const signature = createHmac('sha256', secret).update(manifest).digest('hex');
    const provider = new MercadoPagoPaymentProvider('access', secret, 'https://staging.example.test');
    expect(provider.verifyWebhook({ 'x-signature': `ts=${ts},v1=${signature}`, 'x-request-id': requestId }, dataId)).toBe(true);
    expect(provider.verifyWebhook({ 'x-signature': `ts=${ts},v1=${signature}`, 'x-request-id': requestId }, 'other')).toBe(false);
  });

  it('creates PicPay Pix QR data without treating it as a paid payment', async () => {
    const calls: any[] = [];
    vi.stubGlobal('fetch', async (url: string, init: any) => {
      calls.push({ url, body: init.body });
      if (url.includes('oauth2/token')) return { ok: true, json: async () => ({ access_token: 'token', expires_in: 300 }) };
      return { ok: true, json: async () => ({ merchantChargeId: 'payment_picpay', transactions: [{ transactionStatus: 'PENDING', pix: { qrCode: 'pix-copy-paste', qrCodeBase64: 'pix-image' } }] }) };
    });
    const provider = new PicPayPixPaymentProvider('client', 'secret', 'callback-token', 'https://picpay.test/pix/v1');
    const payment = await provider.createPayment({ paymentId: 'payment_picpay', amount: 49.9, currency: 'brl', reservation, method: 'pix', providerData: { payer: { document: '12345678901', documentType: 'CPF', phone: { countryCode: '55', areaCode: '11', number: '999999999', type: 'MOBILE' } } } });
    expect(payment.providerStatus).toBe('PENDING');
    expect(payment.presentation).toMatchObject({ qrCode: 'pix-copy-paste' });
    expect(JSON.parse(calls[1].body)).toMatchObject({ merchantChargeId: 'payment_picpay', transactions: [{ paymentType: 'PIX', amount: 4990 }] });
    expect(provider.verifyWebhook({ authorization: 'callback-token' })).toBe(true);
    expect(provider.verifyWebhook({ authorization: 'forged' })).toBe(false);
  });

  it('keeps unconfigured providers unavailable without a startup fallback', () => {
    expect(new MercadoPagoPaymentProvider(undefined, undefined, undefined).isConfigured()).toBe(false);
    expect(new PicPayPixPaymentProvider(undefined, undefined, undefined).isConfigured()).toBe(false);
  });
});
