import express from 'express';
import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { publicCheckoutRouter, deriveErrorCode, sanitizeErrorMessage } from './publicCheckoutRouter.ts';
import { PublicCheckoutService } from './publicCheckoutService.ts';

describe('Public Checkout Payment Diagnostics & Structured Logging', () => {
  it('derives expected error codes from message patterns', () => {
    expect(deriveErrorCode('PAYMENT_PROVIDER_NOT_CONFIGURED')).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED');
    expect(deriveErrorCode('Checkout capability is invalid or expired.')).toBe('CHECKOUT_CAPABILITY_INVALID_OR_EXPIRED');
    expect(deriveErrorCode('Reservation is unavailable for checkout.')).toBe('RESERVATION_UNAVAILABLE_FOR_CHECKOUT');
    expect(deriveErrorCode('An idempotency key is required.')).toBe('IDEMPOTENCY_KEY_REQUIRED');
    expect(deriveErrorCode('Reservation is already paid.')).toBe('RESERVATION_ALREADY_PAID');
    expect(deriveErrorCode('Reservation has no payable balance.')).toBe('RESERVATION_NO_BALANCE');
    expect(deriveErrorCode('An active payment attempt already exists for this reservation.')).toBe('ACTIVE_PAYMENT_EXISTS');
    expect(deriveErrorCode('Unable to establish payment idempotency.')).toBe('PAYMENT_IDEMPOTENCY_FAILED');
    expect(deriveErrorCode('9 FAILED_PRECONDITION: The query requires an index.')).toBe('FIRESTORE_INDEX_REQUIRED');
    expect(deriveErrorCode('some unknown error')).toBe('PAYMENT_PROCESSING_ERROR');
  });

  it('sanitizes sensitive data from error messages', () => {
    const raw = 'Failed for guest user.test@example.com with Bearer sec_tok_1234567890abcdef and 48bb4457db29d4bc61bd25b66fe88acaf9ed0785';
    const sanitized = sanitizeErrorMessage(raw);
    expect(sanitized).not.toContain('user.test@example.com');
    expect(sanitized).toContain('[EMAIL_REDACTED]');
    expect(sanitized).not.toContain('sec_tok_1234567890abcdef');
    expect(sanitized).toContain('Bearer [REDACTED]');
    expect(sanitized).not.toContain('48bb4457db29d4bc61bd25b66fe88acaf9ed0785');
    expect(sanitized).toContain('[HASH_REDACTED]');
  });

  it('emits structured failure logs on router validation errors without calling the service', async () => {
    const errorLogs: any[] = [];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((msg) => {
      try {
        errorLogs.push(JSON.parse(msg));
      } catch {
        errorLogs.push(msg);
      }
    });

    const app = express();
    app.use(express.json());
    app.use('/api/public-booking', publicCheckoutRouter);

    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as import('node:net').AddressInfo;

    try {
      // 1. Missing idempotency-key header
      const res1 = await fetch(`http://127.0.0.1:${address.port}/api/public-booking/reservations/res_test_1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-checkout-capability': 'cap_valid_123',
        },
        body: JSON.stringify({ provider: 'mercadopago', method: 'pix' }),
      });
      expect(res1.status).toBe(400);
      const log1 = errorLogs.find((l) => l.event === 'public_booking_payment_failed' && l.errorCode === 'IDEMPOTENCY_KEY_REQUIRED');
      expect(log1).toMatchObject({
        module: 'PublicCheckoutPayments',
        event: 'public_booking_payment_failed',
        stage: 'request_validation',
        provider: 'mercadopago',
        method: 'pix',
        reservationId: 'res_test_1',
        errorCode: 'IDEMPOTENCY_KEY_REQUIRED',
      });

      // 2. Unsupported provider or method
      const res2 = await fetch(`http://127.0.0.1:${address.port}/api/public-booking/reservations/res_test_2/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-checkout-capability': 'cap_valid_123',
          'idempotency-key': '0123456789abcdef12',
        },
        body: JSON.stringify({ provider: 'crypto', method: 'btc' }),
      });
      expect(res2.status).toBe(400);
      const log2 = errorLogs.find((l) => l.event === 'public_booking_payment_failed' && l.errorCode === 'UNSUPPORTED_PROVIDER_OR_METHOD');
      expect(log2).toMatchObject({
        module: 'PublicCheckoutPayments',
        event: 'public_booking_payment_failed',
        stage: 'request_validation',
        reservationId: 'res_test_2',
        errorCode: 'UNSUPPORTED_PROVIDER_OR_METHOD',
      });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      errorSpy.mockRestore();
    }
  });

  it('tracks stages and emits checkpoints through the service lifecycle up to provider call', async () => {
    const infoLogs: any[] = [];
    const errorLogs: any[] = [];
    const logSpy = vi.spyOn(console, 'log').mockImplementation((msg) => {
      try {
        infoLogs.push(JSON.parse(msg));
      } catch {
        infoLogs.push(msg);
      }
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((msg) => {
      try {
        errorLogs.push(JSON.parse(msg));
      } catch {
        errorLogs.push(msg);
      }
    });

    const reservations = new Map<string, any>();
    const caps = new Map<string, any>();
    const payments = new Map<string, any>();

    const catalog = { quote: async () => ({}) } as any;
    const room = {} as any;
    const repo = {
      findReservationById: async (_o: string, _p: string, id: string) => reservations.get(id) || null,
      saveReservation: async (r: any) => { reservations.set(r.reservationId, r); return r; },
      updateReservation: async () => {},
    } as any;
    const checkout = {
      getCapability: async (id: string) => caps.get(id) || null,
      getPayment: async () => null,
      getPaymentById: async () => null,
      createPaymentAttempt: async (p: any) => { payments.set(p.paymentId, p); },
      savePayment: async () => {},
    } as any;

    let providerCalled = false;
    const mockProviders = {
      mercadopago: {
        provider: 'mercadopago',
        supports: (m: string) => m === 'pix',
        isConfigured: () => true,
        createPayment: async () => {
          providerCalled = true;
          return { providerPaymentId: 'mp_order_123', providerReference: 'mp_order_123', providerStatus: 'pending', presentation: { qrCode: 'pix-code' } };
        },
      },
      stripe: { supports: () => false, isConfigured: () => false },
      picpay: { supports: () => false, isConfigured: () => false },
    } as any;

    const service = new PublicCheckoutService(catalog, repo, room, checkout, mockProviders);

    // Create a mock reservation & capability in the in-memory maps
    const reservationId = 'res_diag_001';
    reservations.set(reservationId, {
      reservationId,
      organizationId: 'org_test',
      propertyId: 'prop_test',
      totalAmount: 250,
      balance: 250,
      currency: 'brl',
      paymentStatus: 'pending',
      guest: { fullName: 'Diagnostico Guest', email: 'guest@example.test' },
    });
    // Create valid capability
    const crypto = await import('node:crypto');
    const validCap = 'cap_test_secret_value_12345';
    caps.set(reservationId, {
      reservationId,
      organizationId: 'org_test',
      propertyId: 'prop_test',
      capabilityHash: crypto.createHash('sha256').update(validCap).digest('hex'),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });

    // 1. Successful flow check
    const result = await service.createPayment(
      reservationId,
      validCap,
      { provider: 'mercadopago', method: 'pix' },
      'idempotency_key_test_0001'
    );

    expect(result.status).toBe('pending');
    expect(providerCalled).toBe(true);

    const checkpoint1 = infoLogs.find((l) => l.event === 'payment_reservation_loaded');
    expect(checkpoint1).toMatchObject({
      module: 'PublicCheckoutPayments',
      event: 'payment_reservation_loaded',
      provider: 'mercadopago',
      method: 'pix',
      reservationId,
    });

    const checkpoint2 = infoLogs.find((l) => l.event === 'payment_provider_selected');
    expect(checkpoint2).toMatchObject({
      module: 'PublicCheckoutPayments',
      event: 'payment_provider_selected',
      provider: 'mercadopago',
      method: 'pix',
      reservationId,
    });

    const checkpoint3 = infoLogs.find((l) => l.event === 'payment_provider_call_started');
    expect(checkpoint3).toMatchObject({
      module: 'PublicCheckoutPayments',
      event: 'payment_provider_call_started',
      provider: 'mercadopago',
      method: 'pix',
      reservationId,
      paymentId: expect.any(String),
    });

    // 2. Stage tagging on error
    // Test capability authorization failure
    await expect(
      service.createPayment(
        reservationId,
        'wrong_capability',
        { provider: 'mercadopago', method: 'pix' },
        'idempotency_key_test_0002'
      )
    ).rejects.toMatchObject({
      stage: 'capability_authorization',
      message: 'Checkout capability is invalid or expired.',
    });

    // Test zero balance failure
    reservations.set('res_zero_bal', {
      reservationId: 'res_zero_bal',
      organizationId: 'org_test',
      propertyId: 'prop_test',
      totalAmount: 250,
      balance: 0,
      currency: 'brl',
      paymentStatus: 'paid',
    });
    caps.set('res_zero_bal', {
      reservationId: 'res_zero_bal',
      organizationId: 'org_test',
      propertyId: 'prop_test',
      capabilityHash: crypto.createHash('sha256').update(validCap).digest('hex'),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });

    await expect(
      service.createPayment(
        'res_zero_bal',
        validCap,
        { provider: 'mercadopago', method: 'pix' },
        'idempotency_key_test_0003'
      )
    ).rejects.toMatchObject({
      stage: 'reservation_state_validation',
      message: 'Reservation is already paid.',
    });

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
