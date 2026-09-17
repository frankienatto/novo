import { createHmac, timingSafeEqual } from 'node:crypto';
import Stripe from 'stripe';
import type { Reservation } from '../pms/reservationTypes.ts';
import type { PaymentMethod, PaymentProvider } from './publicCheckoutTypes.ts';

export interface ProviderPaymentInput {
  paymentId: string;
  amount: number;
  currency: 'brl';
  reservation: Reservation;
  method: PaymentMethod;
  providerData?: Record<string, unknown>;
}

export interface ProviderPaymentResult {
  providerPaymentId: string;
  providerReference: string;
  providerStatus: string;
  presentation?: { clientSecret?: string; qrCode?: string; qrCodeBase64?: string; expiresAt?: string };
}

export interface ProviderStatusResult {
  providerPaymentId: string;
  providerReference: string;
  providerStatus: string;
  amount: number;
  currency: string;
  paid: boolean;
  failed?: boolean;
  cancelled?: boolean;
  refunded?: boolean;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  supports(method: PaymentMethod): boolean;
  isConfigured(): boolean;
  createPayment(input: ProviderPaymentInput): Promise<ProviderPaymentResult>;
  getPaymentStatus(reference: string): Promise<ProviderStatusResult>;
}

export type PaymentProviderRegistry = Record<PaymentProvider, PaymentProviderAdapter>;

const fetchJson = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PAYMENT_PROVIDER_HTTP_${response.status}`);
  return payload as Record<string, any>;
};

const cents = (amount: number) => Math.round(amount * 100);
const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export class StripePaymentProvider implements PaymentProviderAdapter {
  readonly provider = 'stripe' as const;
  constructor(private readonly secretKey = process.env.STRIPE_SECRET_KEY) {}
  supports(method: PaymentMethod) { return method === 'card'; }
  isConfigured() { return Boolean(this.secretKey); }
  private client() {
    if (!this.secretKey) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    return new Stripe(this.secretKey);
  }
  async createPayment(input: ProviderPaymentInput): Promise<ProviderPaymentResult> {
    if (!this.supports(input.method)) throw new Error('PAYMENT_METHOD_UNSUPPORTED');
    const intent = await this.client().paymentIntents.create({
      amount: cents(input.amount), currency: input.currency,
      metadata: {
        paymentId: input.paymentId,
        reservationId: input.reservation.reservationId,
        organizationId: input.reservation.organizationId,
        propertyId: input.reservation.propertyId,
        paymentMethod: input.method,
      },
    }, { idempotencyKey: `synapse:${input.paymentId}` });
    return { providerPaymentId: intent.id, providerReference: intent.id, providerStatus: intent.status, presentation: { clientSecret: intent.client_secret || undefined } };
  }
  async getPaymentStatus(reference: string): Promise<ProviderStatusResult> {
    const intent = await this.client().paymentIntents.retrieve(reference);
    return {
      providerPaymentId: intent.id, providerReference: intent.id, providerStatus: intent.status,
      amount: (intent.amount_received || intent.amount) / 100, currency: intent.currency,
      paid: intent.status === 'succeeded', failed: intent.status === 'requires_payment_method', cancelled: intent.status === 'canceled',
    };
  }
}

export class MercadoPagoPaymentProvider implements PaymentProviderAdapter {
  readonly provider = 'mercadopago' as const;
  constructor(
    private readonly accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN,
    private readonly webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET,
    private readonly publicBaseUrl = process.env.PAYMENTS_PUBLIC_BASE_URL,
  ) {}
  supports(method: PaymentMethod) { return method === 'card' || method === 'pix'; }
  isConfigured() { return Boolean(this.accessToken && this.webhookSecret && this.publicBaseUrl); }
  private headers(idempotencyKey?: string) {
    if (!this.isConfigured()) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    return { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) };
  }
  async createPayment(input: ProviderPaymentInput): Promise<ProviderPaymentResult> {
    if (!this.supports(input.method)) throw new Error('PAYMENT_METHOD_UNSUPPORTED');
    const payer = input.providerData?.payer as Record<string, unknown> | undefined;
    const guestFullName = (input.reservation.guest.fullName || '').trim();
    const nameParts = guestFullName.length > 0 ? guestFullName.split(/\s+/) : ['Hospede', 'Synapse'];
    const firstName = (typeof payer?.first_name === 'string' && payer.first_name) ? payer.first_name : nameParts[0];
    const lastName = (typeof payer?.last_name === 'string' && payer.last_name) ? payer.last_name : (nameParts.slice(1).join(' ') || firstName);

    const payerPayload: Record<string, unknown> = {
      email: input.reservation.guest.email,
      first_name: firstName,
      last_name: lastName,
      ...(payer?.identification ? { identification: payer.identification } : {}),
    };

    const payload: Record<string, unknown> = {
      type: 'online',
      processing_mode: 'automatic',
      total_amount: input.amount,
      description: `Synapse reservation ${input.reservation.reservationId}`,
      external_reference: input.paymentId,
      notification_url: `${this.publicBaseUrl}/api/payments/mercadopago/webhook`,
      payer: payerPayload,
    };

    if (input.method === 'pix') {
      payload.transactions = {
        payments: [
          {
            amount: input.amount,
            payment_method: {
              id: 'pix',
              type: 'bank_transfer',
            },
          },
        ],
      };
    } else if (input.method === 'card') {
      const token = typeof input.providerData?.token === 'string' ? input.providerData.token : undefined;
      if (!token) throw new Error('PAYMENT_TOKEN_REQUIRED');
      payload.transactions = {
        payments: [
          {
            amount: input.amount,
            token,
            installments: typeof input.providerData?.installments === 'number' ? input.providerData.installments : 1,
            payment_method: {
              id: (input.providerData?.payment_method_id as string) || 'credit_card',
              type: 'credit_card',
            },
          },
        ],
      };
    }

    const response = await fetchJson('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: this.headers(input.paymentId),
      body: JSON.stringify(payload),
    });

    const transactions = Array.isArray(response.transactions?.payments)
      ? response.transactions.payments
      : Array.isArray(response.transactions)
        ? response.transactions
        : [];
    const firstTx = transactions[0] || response.transactions || response;
    const txData = firstTx.point_of_interaction?.transaction_data
      || firstTx.payment_method_details?.transaction_data
      || response.point_of_interaction?.transaction_data
      || firstTx;

    const qrCode = (typeof txData.qr_code === 'string' && txData.qr_code)
      || (typeof response.qr_code === 'string' && response.qr_code)
      || undefined;
    const qrCodeBase64 = (typeof txData.qr_code_base64 === 'string' && txData.qr_code_base64)
      || (typeof response.qr_code_base64 === 'string' && response.qr_code_base64)
      || undefined;
    const expiresAt = firstTx.date_of_expiration || response.expiration_time || response.date_of_expiration || undefined;

    if (input.method === 'pix' && !qrCode) {
      throw new Error('PAYMENT_PROVIDER_INVALID_PIX_RESPONSE');
    }

    const orderId = String(response.id || '');
    if (!orderId) {
      throw new Error('PAYMENT_PROVIDER_INVALID_RESPONSE');
    }
    const orderStatus = String(response.order_status || response.status || 'pending');

    return {
      providerPaymentId: orderId,
      providerReference: orderId,
      providerStatus: orderStatus,
      presentation: input.method === 'pix' ? { qrCode, qrCodeBase64, expiresAt } : undefined,
    };
  }
  async getPaymentStatus(reference: string): Promise<ProviderStatusResult> {
    const response = await fetchJson(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(reference)}`, { headers: this.headers() });
    const orderId = String(response.id);
    const orderStatus = String(response.order_status || response.status || 'pending').toLowerCase();
    const transactions = Array.isArray(response.transactions?.payments)
      ? response.transactions.payments
      : Array.isArray(response.transactions)
        ? response.transactions
        : [];
    const anyApproved = transactions.some((p: any) => String(p.status).toLowerCase() === 'approved');
    const anyRefunded = transactions.some((p: any) => String(p.status).toLowerCase() === 'refunded');
    const allRejected = transactions.length > 0 && transactions.every((p: any) => ['rejected', 'failed'].includes(String(p.status).toLowerCase()));
    const allCancelled = transactions.length > 0 && transactions.every((p: any) => ['canceled', 'cancelled'].includes(String(p.status).toLowerCase()));

    const paid = orderStatus === 'processed' || orderStatus === 'paid' || anyApproved;
    const failed = orderStatus === 'failed' || orderStatus === 'rejected' || allRejected;
    const cancelled = orderStatus === 'canceled' || orderStatus === 'cancelled' || allCancelled;
    const refunded = orderStatus === 'refunded' || anyRefunded;

    const amount = Number(response.total_amount || response.transaction_amount || transactions[0]?.amount || 0);
    const currency = String(response.currency_id || response.currency || 'brl').toLowerCase();

    return {
      providerPaymentId: orderId,
      providerReference: orderId,
      providerStatus: orderStatus,
      amount,
      currency,
      paid,
      failed,
      cancelled,
      refunded,
    };
  }
  verifyWebhook(headers: Record<string, string | undefined>, dataId: string) {
    if (!this.webhookSecret || !dataId) return false;
    const signature = headers['x-signature']; const requestId = headers['x-request-id'];
    if (!signature) return false;
    const values = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
    // Mercado Pago signs only the manifest fields actually present in the
    // request/signature headers. Adding an empty request-id changes the HMAC.
    const manifest = [
      `id:${dataId};`,
      ...(requestId ? [`request-id:${requestId};`] : []),
      ...(values.ts ? [`ts:${values.ts};`] : []),
    ].join('');
    const expected = createHmac('sha256', this.webhookSecret).update(manifest).digest('hex');
    return Boolean(values.v1 && safeEqual(expected, values.v1));
  }
}

export class PicPayPixPaymentProvider implements PaymentProviderAdapter {
  readonly provider = 'picpay' as const;
  private token?: { value: string; expiresAt: number };
  constructor(
    private readonly clientId = process.env.PICPAY_CLIENT_ID,
    private readonly clientSecret = process.env.PICPAY_CLIENT_SECRET,
    private readonly webhookToken = process.env.PICPAY_WEBHOOK_TOKEN,
    private readonly baseUrl = process.env.PICPAY_PIX_API_BASE_URL || 'https://api.picpay.com/pix/v1',
  ) {}
  supports(method: PaymentMethod) { return method === 'pix'; }
  isConfigured() { return Boolean(this.clientId && this.clientSecret && this.webhookToken); }
  private async accessToken() {
    if (!this.isConfigured()) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const response = await fetchJson('https://api.picpay.com/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: this.clientId, client_secret: this.clientSecret }) });
    this.token = { value: String(response.access_token), expiresAt: Date.now() + Math.max(60, Number(response.expires_in || 300)) * 1000 };
    return this.token.value;
  }
  private async headers() { return { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' }; }
  async createPayment(input: ProviderPaymentInput): Promise<ProviderPaymentResult> {
    if (input.method !== 'pix') throw new Error('PAYMENT_METHOD_UNSUPPORTED');
    const payer = input.providerData?.payer as Record<string, any> | undefined;
    const phone = payer?.phone as Record<string, unknown> | undefined;
    if (!payer?.document || !payer?.documentType || !phone?.countryCode || !phone?.areaCode || !phone?.number || !phone?.type) {
      throw new Error('PICPAY_PAYER_DATA_REQUIRED');
    }
    const response = await fetchJson(`${this.baseUrl}/charge/pix`, {
      method: 'POST', headers: await this.headers(), body: JSON.stringify({
        paymentSource: 'GATEWAY', merchantChargeId: input.paymentId, lateCapture: false,
        customer: { name: input.reservation.guest.fullName, email: input.reservation.guest.email, documentType: payer.documentType, document: payer.document, phone },
        transactions: [{ paymentType: 'PIX', amount: cents(input.amount), pix: { expiration: 900 } }],
      }),
    });
    const transaction = Array.isArray(response.transactions) ? response.transactions[0] || {} : {};
    return { providerPaymentId: String(response.id || input.paymentId), providerReference: String(response.merchantChargeId || input.paymentId), providerStatus: String(transaction.transactionStatus || response.chargeStatus || 'PENDING'), presentation: { qrCode: transaction.pix?.qrCode, qrCodeBase64: transaction.pix?.qrCodeBase64 } };
  }
  async getPaymentStatus(reference: string): Promise<ProviderStatusResult> {
    const response = await fetchJson(`${this.baseUrl}/charge/${encodeURIComponent(reference)}`, { headers: await this.headers() });
    const transaction = Array.isArray(response.transactions) ? response.transactions[0] || {} : {};
    const status = String(transaction.transactionStatus || response.chargeStatus || 'PENDING').toUpperCase();
    return { providerPaymentId: String(response.id || reference), providerReference: String(response.merchantChargeId || reference), providerStatus: status, amount: Number(transaction.amount ?? response.originalAmount) / 100, currency: 'brl', paid: status === 'PAID', failed: ['DENIED', 'ERROR'].includes(status), cancelled: ['CANCELED', 'EXPIRED'].includes(status), refunded: status === 'REFUNDED' };
  }
  verifyWebhook(headers: Record<string, string | undefined>) {
    return Boolean(this.webhookToken && headers.authorization && safeEqual(this.webhookToken, headers.authorization));
  }
}

export const createPaymentProviderRegistry = (): PaymentProviderRegistry => ({
  stripe: new StripePaymentProvider(),
  mercadopago: new MercadoPagoPaymentProvider(),
  picpay: new PicPayPixPaymentProvider(),
});
