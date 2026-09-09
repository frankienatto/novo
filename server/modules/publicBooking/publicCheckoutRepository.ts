import { getAdminFirestore } from '../../config/firebaseAdmin.ts';
import type { CheckoutCapabilityRecord, PaymentRecord, ReservationIdempotencyRecord } from './publicCheckoutTypes.ts';

export interface IPublicCheckoutRepository {
  getReservationIdempotency(id: string): Promise<ReservationIdempotencyRecord | null>;
  createReservationIdempotency(record: ReservationIdempotencyRecord): Promise<void>;
  getCapability(reservationId: string): Promise<CheckoutCapabilityRecord | null>;
  saveCapability(record: CheckoutCapabilityRecord): Promise<void>;
  getPayment(reservationId: string): Promise<PaymentRecord | null>;
  getPaymentById(paymentId: string): Promise<PaymentRecord | null>;
  getPaymentByProviderReference(provider: PaymentRecord['provider'], reference: string): Promise<PaymentRecord | null>;
  createPaymentAttempt(record: PaymentRecord): Promise<void>;
  savePayment(record: PaymentRecord): Promise<void>;
  getStripeEvent(eventId: string): Promise<boolean>;
  saveStripeEvent(eventId: string, reservationId: string): Promise<void>;
  getWebhookEvent(provider: PaymentRecord['provider'], eventId: string): Promise<boolean>;
  saveWebhookEvent(provider: PaymentRecord['provider'], eventId: string, paymentId: string): Promise<void>;
}

export class PublicCheckoutRepository implements IPublicCheckoutRepository {
  private get db() { return getAdminFirestore(); }
  private async get<T>(collection: string, id: string): Promise<T | null> {
    const snapshot = await this.db.collection(collection).doc(id).get();
    return snapshot.exists ? snapshot.data() as T : null;
  }
  getReservationIdempotency(id: string) { return this.get<ReservationIdempotencyRecord>('publicReservationIdempotency', id); }
  async createReservationIdempotency(record: ReservationIdempotencyRecord) {
    await this.db.collection('publicReservationIdempotency').doc(record.idempotencyId).create(record);
  }
  getCapability(reservationId: string) { return this.get<CheckoutCapabilityRecord>('checkoutCapabilities', reservationId); }
  async saveCapability(record: CheckoutCapabilityRecord) { await this.db.collection('checkoutCapabilities').doc(record.reservationId).set(record); }
  async getPayment(reservationId: string) {
    const legacy = await this.get<PaymentRecord>('paymentRecords', reservationId);
    if (legacy) return legacy;
    const snapshot = await this.db.collection('paymentRecords').where('reservationId', '==', reservationId).orderBy('createdAt', 'desc').limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as PaymentRecord;
  }
  getPaymentById(paymentId: string) { return this.get<PaymentRecord>('paymentRecords', paymentId); }
  async getPaymentByProviderReference(provider: PaymentRecord['provider'], reference: string) {
    const snapshot = await this.db.collection('paymentRecords').where('provider', '==', provider).where('providerReference', '==', reference).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as PaymentRecord;
  }
  async createPaymentAttempt(record: PaymentRecord) { await this.db.collection('paymentRecords').doc(record.paymentId).create(record); }
  async savePayment(record: PaymentRecord) { await this.db.collection('paymentRecords').doc(record.paymentId).set(record, { merge: true }); }
  async getStripeEvent(eventId: string) { return !!await this.get('stripeEvents', eventId); }
  async saveStripeEvent(eventId: string, reservationId: string) { await this.db.collection('stripeEvents').doc(eventId).create({ eventId, reservationId, createdAt: new Date().toISOString() }); }
  async getWebhookEvent(provider: PaymentRecord['provider'], eventId: string) { return !!await this.get('paymentWebhookEvents', `${provider}:${eventId}`); }
  async saveWebhookEvent(provider: PaymentRecord['provider'], eventId: string, paymentId: string) {
    await this.db.collection('paymentWebhookEvents').doc(`${provider}:${eventId}`).create({ provider, eventId, paymentId, createdAt: new Date().toISOString() });
  }
}
export const publicCheckoutRepository = new PublicCheckoutRepository();
