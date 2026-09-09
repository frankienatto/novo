import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { IReservationRepository } from '../pms/reservationRepository.ts';
import { reservationRepository } from '../pms/reservationRepository.ts';
import type { IRoomRepository } from '../pms/roomRepository.ts';
import { roomRepository } from '../pms/roomRepository.ts';
import type { Reservation } from '../pms/reservationTypes.ts';
import { PublicBookingService, publicBookingService } from './publicBookingService.ts';
import type { IPublicCheckoutRepository } from './publicCheckoutRepository.ts';
import { publicCheckoutRepository } from './publicCheckoutRepository.ts';
import type { CreateCanonicalPaymentRequest, PaymentRecord, PublicReservationRequest } from './publicCheckoutTypes.ts';
import { createPaymentProviderRegistry, type PaymentProviderRegistry } from './paymentProviders.ts';

const CAPABILITY_TTL_MS = 30 * 60 * 1000;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export class PublicCheckoutService {
  constructor(
    private readonly catalog: PublicBookingService = publicBookingService,
    private readonly reservations: IReservationRepository = reservationRepository,
    private readonly rooms: IRoomRepository = roomRepository,
    private readonly checkout: IPublicCheckoutRepository = publicCheckoutRepository,
    private readonly providers: PaymentProviderRegistry = createPaymentProviderRegistry(),
  ) {}

  async createReservation(request: PublicReservationRequest) {
    if (!request.idempotencyKey || request.idempotencyKey.length < 16) throw new Error('An idempotency key is required.');
    if (!request.guest?.fullName || request.guest.fullName.trim().length < 2 || !request.guest.email?.includes('@')) {
      throw new Error('Valid guest details are required.');
    }
    const quote = await this.catalog.quote(request);
    const idempotencyId = sha256(`${quote.organizationId}:${quote.propertyId}:${request.idempotencyKey}`);
    // Hash only the accepted public choices. Client-supplied financial or
    // internal fields are intentionally excluded from idempotency semantics.
    const requestHash = sha256(JSON.stringify({
      publicPropertyId: request.publicPropertyId, publicUnitId: request.publicUnitId,
      checkInDate: request.checkInDate, checkOutDate: request.checkOutDate,
      adultsCount: request.adultsCount, childrenCount: request.childrenCount || 0,
      ratePlanId: request.ratePlanId, packageId: request.packageId,
      addOnIds: request.addOnIds || [], promoCode: request.promoCode,
      guest: { fullName: request.guest.fullName.trim(), email: request.guest.email.toLowerCase(), phone: request.guest.phone },
    }));
    const existing = await this.checkout.getReservationIdempotency(idempotencyId);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new Error('Idempotency key was already used for a different request.');
      const persisted = await this.reservations.findReservationById(existing.organizationId, existing.propertyId, existing.reservation.reservationId);
      const reservation = persisted || await this.reservations.saveReservation(existing.reservation);
      return { reservation, checkoutCapability: await this.issueCapability(reservation) };
    }

    const unit = await this.rooms.findUnitById(quote.organizationId, quote.propertyId, quote.unitId);
    if (!unit) throw new Error('Canonical unit is unavailable.');
    const conflicts = await this.reservations.findConflictingReservations(quote.organizationId, quote.propertyId, quote.unitId, request.checkInDate, request.checkOutDate);
    if (conflicts.length) throw new Error('The selected unit is unavailable for these dates.');

    const now = new Date().toISOString();
    const reservation: Reservation = {
      reservationId: `res_${randomUUID()}`, organizationId: quote.organizationId, propertyId: quote.propertyId,
      unitId: quote.unitId, categoryId: unit.categoryId,
      guest: { guestId: `gst_${randomUUID()}`, fullName: request.guest.fullName.trim(), email: request.guest.email.trim().toLowerCase(), phone: request.guest.phone },
      stayPeriod: { checkInDate: request.checkInDate, checkOutDate: request.checkOutDate, numberOfNights: quote.numberOfNights },
      adultsCount: request.adultsCount, childrenCount: request.childrenCount || 0,
      status: 'pending', source: 'direct_website', paymentStatus: 'pending', totalAmount: quote.totalAmount,
      currency: quote.currency, amountPaid: 0, balance: quote.totalAmount, createdAt: now, updatedAt: now,
    };
    try {
      await this.checkout.createReservationIdempotency({ idempotencyId, organizationId: quote.organizationId, propertyId: quote.propertyId, requestHash, reservation, createdAt: now });
    } catch {
      const raced = await this.checkout.getReservationIdempotency(idempotencyId);
      if (!raced || raced.requestHash !== requestHash) throw new Error('Unable to establish reservation idempotency.');
      return { reservation: raced.reservation, checkoutCapability: await this.issueCapability(raced.reservation) };
    }
    const saved = this.reservations.saveReservationAtomically
      ? await this.reservations.saveReservationAtomically(reservation)
      : await this.reservations.saveReservation(reservation);
    return { reservation: saved, checkoutCapability: await this.issueCapability(saved) };
  }

  /** Provider-neutral payment creation. Financial facts are always derived from
   * the canonical reservation, never the browser's request. */
  async createPayment(reservationId: string, capability: string, request: CreateCanonicalPaymentRequest, idempotencyKey: string) {
    const reservation = await this.authorizeCheckout(reservationId, capability);
    if (!idempotencyKey || idempotencyKey.length < 16) throw new Error('An idempotency key is required.');
    if (reservation.paymentStatus === 'paid' || reservation.balance === 0) throw new Error('Reservation is already paid.');
    const amount = reservation.balance ?? reservation.totalAmount;
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Reservation has no payable balance.');
    const existing = await this.checkout.getPayment(reservationId);
    if (existing && ['pending', 'processing'].includes(existing.status)) {
      if (existing.provider !== request.provider || existing.paymentMethod !== request.method) throw new Error('An active payment attempt already exists for this reservation.');
      return existing;
    }
    const provider = this.providers[request.provider];
    if (!provider || !provider.supports(request.method)) throw new Error('PAYMENT_METHOD_UNSUPPORTED');
    if (!provider.isConfigured()) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    const now = new Date().toISOString();
    // A key represents one payment attempt. Retrying the same network request
    // reuses this record; a failed/expired attempt can be retried with a new
    // key without reusing a provider-side charge reference.
    const idempotencyKeyHash = sha256(`${reservation.organizationId}:${reservation.propertyId}:${idempotencyKey}`);
    const digest = sha256(`${reservation.reservationId}:${request.provider}:${request.method}:${amount}:${reservation.currency || 'brl'}:${idempotencyKeyHash}`);
    const paymentId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    const sameAttempt = await this.checkout.getPaymentById(paymentId);
    if (sameAttempt) return sameAttempt;
    const pending: PaymentRecord = { paymentId, reservationId, organizationId: reservation.organizationId, propertyId: reservation.propertyId, provider: request.provider, paymentMethod: request.method, providerPaymentId: paymentId, providerReference: paymentId, idempotencyKeyHash, amount, currency: reservation.currency || 'brl', status: 'processing', createdAt: now, updatedAt: now };
    try {
      await this.checkout.createPaymentAttempt(pending);
    } catch {
      const raced = await this.checkout.getPaymentById(paymentId);
      if (raced) return raced;
      throw new Error('Unable to establish payment idempotency.');
    }
    try {
      const result = await provider.createPayment({ paymentId, amount, currency: reservation.currency || 'brl', reservation, method: request.method, providerData: request.providerData });
      const payment: PaymentRecord = { ...pending, providerPaymentId: result.providerPaymentId, providerReference: result.providerReference, providerStatus: result.providerStatus, presentation: result.presentation, status: 'pending', updatedAt: new Date().toISOString(), ...(request.provider === 'stripe' ? { stripePaymentIntentId: result.providerPaymentId } : {}) };
      await this.checkout.savePayment(payment);
      if (request.provider === 'stripe') await this.reservations.updateReservation(reservation.organizationId, reservation.propertyId, reservationId, { stripePaymentIntentId: result.providerPaymentId });
      return payment;
    } catch (error) {
      await this.checkout.savePayment({ ...pending, status: 'failed', updatedAt: new Date().toISOString() });
      throw error;
    }
  }

  /** Compatibility endpoint for P0.3B clients. New integrations must call
   * createPayment with an explicit provider and method. */
  async createPaymentIntent(reservationId: string, capability: string, stripe: { paymentIntents: { create: Function; retrieve?: Function } }) {
    const reservation = await this.authorizeCheckout(reservationId, capability);
    if (reservation.paymentStatus === 'paid' || reservation.balance === 0) throw new Error('Reservation is already paid.');
    const amount = reservation.balance ?? reservation.totalAmount;
    const existing = await this.checkout.getPayment(reservationId);
    if (existing && ['pending', 'processing'].includes(existing.status)) {
      if (existing.provider !== 'stripe' || existing.paymentMethod !== 'card') throw new Error('An active payment attempt already exists for this reservation.');
      if (!stripe.paymentIntents.retrieve) throw new Error('Payment intent retrieval is unavailable.');
      const intent = await stripe.paymentIntents.retrieve(existing.providerPaymentId || existing.stripePaymentIntentId);
      return { ...existing, clientSecret: intent.client_secret };
    }
    const intent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency: reservation.currency || 'brl', metadata: { reservationId, organizationId: reservation.organizationId, propertyId: reservation.propertyId, paymentMethod: 'card' } }, { idempotencyKey: `reservation:${reservation.reservationId}:balance:${amount}` });
    const now = new Date().toISOString();
    const payment: PaymentRecord = { paymentId: randomUUID(), reservationId, organizationId: reservation.organizationId, propertyId: reservation.propertyId, provider: 'stripe', paymentMethod: 'card', providerPaymentId: intent.id, providerReference: intent.id, idempotencyKeyHash: sha256(`legacy:${reservationId}:${amount}`), stripePaymentIntentId: intent.id, amount, currency: reservation.currency || 'brl', providerStatus: intent.status, status: 'pending', presentation: { clientSecret: intent.client_secret || undefined }, createdAt: now, updatedAt: now };
    await this.checkout.savePayment(payment);
    await this.reservations.updateReservation(reservation.organizationId, reservation.propertyId, reservationId, { stripePaymentIntentId: intent.id });
    return { ...payment, clientSecret: intent.client_secret };
  }

  async processStripeEvent(event: any) {
    if (await this.checkout.getStripeEvent(event.id)) return { replay: true };
    const intent = event.data?.object;
    const reservationId = intent?.metadata?.reservationId;
    const organizationId = intent?.metadata?.organizationId;
    const propertyId = intent?.metadata?.propertyId;
    if (!reservationId || !organizationId || !propertyId) throw new Error('Stripe event metadata is incomplete.');
    const reservation = await this.reservations.findReservationById(organizationId, propertyId, reservationId);
    const payment = await this.checkout.getPayment(reservationId);
    if (!reservation || !payment || payment.provider !== 'stripe' || payment.providerPaymentId !== intent.id || payment.organizationId !== organizationId || payment.propertyId !== propertyId) throw new Error('Stripe event does not match a persisted payment.');
    const now = new Date().toISOString();
    if (event.type === 'payment_intent.succeeded') {
      const expectedCents = Math.round(payment.amount * 100);
      if (intent.currency !== payment.currency || intent.amount_received !== expectedCents) throw new Error('Stripe payment amount or currency does not match the reservation.');
      await this.confirmPayment(payment, reservation, now);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      await this.checkout.savePayment({ ...payment, status: event.type.endsWith('canceled') ? 'cancelled' : 'failed', updatedAt: now });
    } else return { ignored: true };
    await this.checkout.saveStripeEvent(event.id, reservationId);
    return { replay: false };
  }

  async processProviderWebhook(providerName: 'mercadopago' | 'picpay', eventId: string, providerReference: string) {
    const provider = this.providers[providerName];
    if (!provider?.isConfigured()) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    if (await this.checkout.getWebhookEvent(providerName, eventId)) return { replay: true };
    const payment = await this.checkout.getPaymentByProviderReference(providerName, providerReference);
    if (!payment || payment.provider !== providerName) throw new Error('Provider payment does not match a canonical payment.');
    const reservation = await this.reservations.findReservationById(payment.organizationId, payment.propertyId, payment.reservationId);
    if (!reservation || reservation.organizationId !== payment.organizationId || reservation.propertyId !== payment.propertyId) throw new Error('Provider payment reservation does not match tenant scope.');
    const status = await provider.getPaymentStatus(providerReference);
    if (status.providerPaymentId !== payment.providerPaymentId || status.providerReference !== payment.providerReference || status.amount !== payment.amount || status.currency.toLowerCase() !== payment.currency) throw new Error('Provider status does not match canonical payment.');
    const now = new Date().toISOString();
    if (status.paid) await this.confirmPayment(payment, reservation, now, status.providerStatus);
    else if (status.refunded) await this.checkout.savePayment({ ...payment, status: 'refunded', providerStatus: status.providerStatus, updatedAt: now });
    else if (status.cancelled) await this.checkout.savePayment({ ...payment, status: 'cancelled', providerStatus: status.providerStatus, updatedAt: now });
    else if (status.failed) await this.checkout.savePayment({ ...payment, status: 'failed', providerStatus: status.providerStatus, updatedAt: now });
    else await this.checkout.savePayment({ ...payment, status: 'pending', providerStatus: status.providerStatus, updatedAt: now });
    await this.checkout.saveWebhookEvent(providerName, eventId, payment.paymentId);
    return { replay: false };
  }

  private async confirmPayment(payment: PaymentRecord, reservation: Reservation, now: string, providerStatus?: string) {
    if (payment.status === 'paid') return;
    if (reservation.organizationId !== payment.organizationId || reservation.propertyId !== payment.propertyId || reservation.reservationId !== payment.reservationId) throw new Error('Payment tenant validation failed.');
    const balance = reservation.balance ?? reservation.totalAmount;
    if (payment.amount !== balance) throw new Error('Payment amount does not match outstanding reservation balance.');
    await this.reservations.updateReservation(payment.organizationId, payment.propertyId, payment.reservationId, { paymentStatus: 'paid', amountPaid: payment.amount, balance: 0, status: 'confirmed' });
    await this.checkout.savePayment({ ...payment, status: 'paid', providerStatus: providerStatus || payment.providerStatus, paidAt: now, updatedAt: now });
  }

  private async issueCapability(reservation: Reservation) {
    const capability = randomBytes(32).toString('base64url');
    await this.checkout.saveCapability({ reservationId: reservation.reservationId, organizationId: reservation.organizationId, propertyId: reservation.propertyId, capabilityHash: sha256(capability), expiresAt: new Date(Date.now() + CAPABILITY_TTL_MS).toISOString(), createdAt: new Date().toISOString() });
    return capability;
  }
  private async authorizeCheckout(reservationId: string, capability: string) {
    const record = await this.checkout.getCapability(reservationId);
    if (!record || new Date(record.expiresAt) <= new Date() || sha256(capability || '') !== record.capabilityHash) throw new Error('Checkout capability is invalid or expired.');
    const reservation = await this.reservations.findReservationById(record.organizationId, record.propertyId, reservationId);
    if (!reservation || reservation.organizationId !== record.organizationId || reservation.propertyId !== record.propertyId) throw new Error('Reservation is unavailable for checkout.');
    return reservation;
  }
}
export const publicCheckoutService = new PublicCheckoutService();
