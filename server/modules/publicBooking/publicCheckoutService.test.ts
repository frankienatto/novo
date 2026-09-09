import { describe, expect, it } from 'vitest';
import { PublicCheckoutService } from './publicCheckoutService.ts';

function fixture(providers?: any) {
  const reservations = new Map<string, any>();
  const idem = new Map<string, any>(); const caps = new Map<string, any>(); const payments = new Map<string, any>(); const events = new Set<string>();
  const catalog = { quote: async () => ({ organizationId: 'org_a', propertyId: 'prop_a', unitId: 'unit_a', currency: 'brl', numberOfNights: 2, totalAmount: 400 }) } as any;
  const room = { findUnitById: async () => ({ unitId: 'unit_a', categoryId: 'cat_a', active: true }) } as any;
  const repo = {
    findConflictingReservations: async () => [], findReservationById: async (_o: string, _p: string, id: string) => reservations.get(id) || null,
    saveReservation: async (r: any) => { reservations.set(r.reservationId, structuredClone(r)); return r; },
    updateReservation: async (_o: string, _p: string, id: string, update: any) => { const value = { ...reservations.get(id), ...update }; reservations.set(id, value); return value; },
  } as any;
  const checkout = {
    getReservationIdempotency: async (id: string) => idem.get(id) || null, createReservationIdempotency: async (r: any) => { if (idem.has(r.idempotencyId)) throw new Error('duplicate'); idem.set(r.idempotencyId, r); },
    getCapability: async (id: string) => caps.get(id) || null, saveCapability: async (r: any) => caps.set(r.reservationId, r),
    getPayment: async (id: string) => payments.get(id) || null,
    getPaymentById: async (id: string) => [...payments.values()].find((payment: any) => payment.paymentId === id) || null,
    getPaymentByProviderReference: async (provider: string, reference: string) => [...payments.values()].find((payment: any) => payment.provider === provider && payment.providerReference === reference) || null,
    savePayment: async (r: any) => payments.set(r.reservationId, r),
    createPaymentAttempt: async (r: any) => { if ([...payments.values()].some((payment: any) => payment.paymentId === r.paymentId)) throw new Error('duplicate'); payments.set(r.reservationId, r); },
    getStripeEvent: async (id: string) => events.has(id), saveStripeEvent: async (id: string) => { events.add(id); },
    getWebhookEvent: async (provider: string, id: string) => events.has(`${provider}:${id}`),
    saveWebhookEvent: async (provider: string, id: string) => { events.add(`${provider}:${id}`); },
  } as any;
  return { service: new PublicCheckoutService(catalog, repo, room, checkout, providers), reservations, payments };
}
const request = { publicPropertyId: 'public-a', publicUnitId: 'unit-public-a', checkInDate: '2027-01-10', checkOutDate: '2027-01-12', adultsCount: 2, guest: { fullName: 'Guest A', email: 'guest@example.test' }, idempotencyKey: '0123456789abcdef' };

describe('public checkout foundation', () => {
  it('creates a pending canonical reservation and retries idempotently', async () => {
    const { service, reservations } = fixture();
    const first = await service.createReservation({ ...request, totalPrice: 1, organizationId: 'attacker' } as any);
    const retry = await service.createReservation(request);
    expect(first.reservation).toMatchObject({ organizationId: 'org_a', propertyId: 'prop_a', totalAmount: 400, balance: 400, paymentStatus: 'pending', status: 'pending' });
    expect(retry.reservation.reservationId).toBe(first.reservation.reservationId);
    expect(reservations.size).toBe(1);
  });

  it('requires a reservation-bound capability and derives Stripe amount from the reservation', async () => {
    const { service } = fixture(); const created = await service.createReservation(request);
    await expect(service.createPaymentIntent(created.reservation.reservationId, 'forged', { paymentIntents: { create: async () => ({}) } } as any)).rejects.toThrow('capability');
    const create = async (params: any) => ({ id: 'pi_a', client_secret: 'test_secret', ...params });
    const payment = await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create } } as any);
    expect(payment.amount).toBe(400);
  });

  it('reuses the persisted PaymentIntent on a valid retry', async () => {
    const { service } = fixture(); const created = await service.createReservation(request);
    await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create: async () => ({ id: 'pi_a', client_secret: 'first' }) } } as any);
    const retry = await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create: async () => { throw new Error('must not create'); }, retrieve: async () => ({ client_secret: 'retrieved' }) } } as any);
    expect(retry).toMatchObject({ stripePaymentIntentId: 'pi_a', clientSecret: 'retrieved' });
  });

  it('rejects an expired capability and never authorizes a reservation by ID alone', async () => {
    const { service } = fixture(); const created = await service.createReservation(request);
    await expect(service.createPaymentIntent(created.reservation.reservationId, '', { paymentIntents: { create: async () => ({}) } } as any)).rejects.toThrow('capability');
  });

  it('confirms payment only from a matching Stripe event and rejects replay', async () => {
    const { service, reservations } = fixture(); const created = await service.createReservation(request);
    await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create: async () => ({ id: 'pi_a', client_secret: 'test' }) } } as any);
    const event = { id: 'evt_a', type: 'payment_intent.succeeded', data: { object: { id: 'pi_a', amount_received: 40000, currency: 'brl', metadata: { reservationId: created.reservation.reservationId, organizationId: 'org_a', propertyId: 'prop_a' } } } };
    await expect(service.processStripeEvent(event)).resolves.toEqual({ replay: false });
    expect(reservations.get(created.reservation.reservationId)).toMatchObject({ paymentStatus: 'paid', balance: 0 });
    await expect(service.processStripeEvent(event)).resolves.toEqual({ replay: true });
  });

  it('rejects Stripe success with mismatched amount or currency without marking paid', async () => {
    const { service, reservations } = fixture(); const created = await service.createReservation(request);
    await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create: async () => ({ id: 'pi_a', client_secret: 'test' }) } } as any);
    const event = { id: 'evt_bad', type: 'payment_intent.succeeded', data: { object: { id: 'pi_a', amount_received: 1, currency: 'usd', metadata: { reservationId: created.reservation.reservationId, organizationId: 'org_a', propertyId: 'prop_a' } } } };
    await expect(service.processStripeEvent(event)).rejects.toThrow('amount or currency');
    expect(reservations.get(created.reservation.reservationId).paymentStatus).toBe('pending');
  });

  it('records a failed Stripe event without confirming payment', async () => {
    const { service, reservations } = fixture(); const created = await service.createReservation(request);
    await service.createPaymentIntent(created.reservation.reservationId, created.checkoutCapability, { paymentIntents: { create: async () => ({ id: 'pi_a', client_secret: 'test' }) } } as any);
    const event = { id: 'evt_failed', type: 'payment_intent.payment_failed', data: { object: { id: 'pi_a', metadata: { reservationId: created.reservation.reservationId, organizationId: 'org_a', propertyId: 'prop_a' } } } };
    await expect(service.processStripeEvent(event)).resolves.toEqual({ replay: false });
    expect(reservations.get(created.reservation.reservationId).paymentStatus).toBe('pending');
  });

  it('creates provider-neutral Mercado Pago Pix presentation without marking the reservation paid', async () => {
    const providers = {
      mercadopago: { provider: 'mercadopago', supports: (method: string) => method === 'pix' || method === 'card', isConfigured: () => true, createPayment: async () => ({ providerPaymentId: 'mp_1', providerReference: 'mp_1', providerStatus: 'pending', presentation: { qrCode: 'pix-copy-paste' } }), getPaymentStatus: async () => ({}) },
      stripe: { supports: () => true, isConfigured: () => true }, picpay: { supports: () => true, isConfigured: () => true },
    } as any;
    const { service, reservations } = fixture(providers); const created = await service.createReservation(request);
    const payment = await service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'mercadopago', method: 'pix' }, 'mercadopago-pix-attempt-001');
    expect(payment).toMatchObject({ provider: 'mercadopago', paymentMethod: 'pix', status: 'pending', amount: 400, presentation: { qrCode: 'pix-copy-paste' } });
    expect(reservations.get(created.reservation.reservationId).paymentStatus).toBe('pending');
  });

  it('confirms a verified PicPay Pix event once and rejects amount mismatches', async () => {
    let status: any = { providerPaymentId: 'pc_1', providerReference: 'payment-ref', providerStatus: 'PAID', amount: 400, currency: 'brl', paid: true };
    const providers = {
      picpay: { provider: 'picpay', supports: (method: string) => method === 'pix', isConfigured: () => true, createPayment: async () => ({ providerPaymentId: 'pc_1', providerReference: 'payment-ref', providerStatus: 'PENDING', presentation: { qrCode: 'pix' } }), getPaymentStatus: async () => status },
      stripe: { supports: () => true, isConfigured: () => true }, mercadopago: { supports: () => true, isConfigured: () => true },
    } as any;
    const { service, reservations } = fixture(providers); const created = await service.createReservation(request);
    await service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'picpay', method: 'pix', providerData: { payer: {} } }, 'picpay-pix-attempt-0001');
    await expect(service.processProviderWebhook('picpay', 'evt_picpay_1', 'payment-ref')).resolves.toEqual({ replay: false });
    expect(reservations.get(created.reservation.reservationId)).toMatchObject({ paymentStatus: 'paid', balance: 0 });
    await expect(service.processProviderWebhook('picpay', 'evt_picpay_1', 'payment-ref')).resolves.toEqual({ replay: true });
    status = { ...status, amount: 1 };
    await expect(service.processProviderWebhook('picpay', 'evt_picpay_bad', 'payment-ref')).rejects.toThrow('does not match');
  });

  it('fails closed for an unconfigured provider without affecting checkout startup', async () => {
    const providers = {
      mercadopago: { provider: 'mercadopago', supports: () => true, isConfigured: () => false },
      stripe: { supports: () => true, isConfigured: () => false }, picpay: { supports: () => true, isConfigured: () => false },
    } as any;
    const { service } = fixture(providers); const created = await service.createReservation(request);
    await expect(service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'picpay', method: 'pix' }, 'picpay-unavailable-0001')).rejects.toThrow('NOT_CONFIGURED');
  });

  it('reuses a network retry but permits a new attempt after a terminal failure', async () => {
    let createCalls = 0;
    const providers = {
      picpay: { provider: 'picpay', supports: () => true, isConfigured: () => true, createPayment: async () => { createCalls++; if (createCalls === 1) throw new Error('provider rejected'); return { providerPaymentId: `pic_${createCalls}`, providerReference: `ref_${createCalls}`, providerStatus: 'PENDING' }; } },
      stripe: { supports: () => true, isConfigured: () => true }, mercadopago: { supports: () => true, isConfigured: () => true },
    } as any;
    const { service } = fixture(providers); const created = await service.createReservation(request);
    await expect(service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'picpay', method: 'pix' }, 'payment-retry-key-0001')).rejects.toThrow('provider rejected');
    const retry = await service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'picpay', method: 'pix' }, 'payment-retry-key-0001');
    expect(retry.status).toBe('failed');
    expect(createCalls).toBe(1);
    const renewed = await service.createPayment(created.reservation.reservationId, created.checkoutCapability, { provider: 'picpay', method: 'pix' }, 'payment-retry-key-0002');
    expect(renewed.status).toBe('pending');
    expect(createCalls).toBe(2);
  });
});
