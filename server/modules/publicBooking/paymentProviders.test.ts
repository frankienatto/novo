import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MercadoPagoPaymentProvider, PicPayPixPaymentProvider } from './paymentProviders.ts';

const reservation: any = {
  reservationId: 'res_payment_test', organizationId: 'org_a', propertyId: 'prop_a',
  guest: { fullName: 'Guest Test', email: 'guest@example.test' },
};

afterEach(() => vi.unstubAllGlobals());

describe('canonical payment provider adapters', () => {
  it('creates Mercado Pago card and Pix payments with server-derived amount and idempotency', async () => {
    const requests: any[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: any) => {
      requests.push(JSON.parse(init.body));
      return { ok: true, json: async () => ({ id: 123, status: 'pending', point_of_interaction: { transaction_data: { qr_code: 'pix-code', qr_code_base64: 'base64' } } }) };
    });
    const provider = new MercadoPagoPaymentProvider('access', 'webhook', 'https://staging.example.test');
    await provider.createPayment({ paymentId: 'payment_card', amount: 123.45, currency: 'brl', reservation, method: 'card', providerData: { token: 'tokenized-card' } });
    const pix = await provider.createPayment({ paymentId: 'payment_pix', amount: 123.45, currency: 'brl', reservation, method: 'pix' });
    expect(requests[0]).toMatchObject({ transaction_amount: 123.45, external_reference: 'payment_card', token: 'tokenized-card' });
    expect(requests[1]).toMatchObject({ transaction_amount: 123.45, external_reference: 'payment_pix', payment_method_id: 'pix' });
    expect(pix.presentation).toMatchObject({ qrCode: 'pix-code' });
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
