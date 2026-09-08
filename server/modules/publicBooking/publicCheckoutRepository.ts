import { getAdminFirestore } from '../../config/firebaseAdmin.ts';
import type { CheckoutCapabilityRecord, PaymentRecord, ReservationIdempotencyRecord } from './publicCheckoutTypes.ts';

export interface IPublicCheckoutRepository {
  getReservationIdempotency(id: string): Promise<ReservationIdempotencyRecord | null>;
  createReservationIdempotency(record: ReservationIdempotencyRecord): Promise<void>;
  getCapability(reservationId: string): Promise<CheckoutCapabilityRecord | null>;
  saveCapability(record: CheckoutCapabilityRecord): Promise<void>;
  getPayment(reservationId: string): Promise<PaymentRecord | null>;
  savePayment(record: PaymentRecord): Promise<void>;
  getStripeEvent(eventId: string): Promise<boolean>;
  saveStripeEvent(eventId: string, reservationId: string): Promise<void>;
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
  getPayment(reservationId: string) { return this.get<PaymentRecord>('paymentRecords', reservationId); }
  async savePayment(record: PaymentRecord) { await this.db.collection('paymentRecords').doc(record.reservationId).set(record); }
  async getStripeEvent(eventId: string) { return !!await this.get('stripeEvents', eventId); }
  async saveStripeEvent(eventId: string, reservationId: string) { await this.db.collection('stripeEvents').doc(eventId).create({ eventId, reservationId, createdAt: new Date().toISOString() }); }
}
export const publicCheckoutRepository = new PublicCheckoutRepository();
