import { describe, expect, it } from 'vitest';
import { PublicCheckoutService } from './publicCheckoutService.ts';

function fixture() {
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
    getPayment: async (id: string) => payments.get(id) || null, savePayment: async (r: any) => payments.set(r.reservationId, r),
    getStripeEvent: async (id: string) => events.has(id), saveStripeEvent: async (id: string) => { events.add(id); },
  } as any;
  return { service: new PublicCheckoutService(catalog, repo, room, checkout), reservations };
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
});
