import type { Reservation } from '../pms/reservationTypes.ts';

export interface PublicReservationRequest {
  publicPropertyId: string;
  publicUnitId: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount?: number;
  ratePlanId?: string;
  packageId?: string;
  addOnIds?: string[];
  promoCode?: string;
  guest: { fullName: string; email: string; phone?: string };
  idempotencyKey: string;
}

export interface CheckoutCapabilityRecord {
  reservationId: string;
  organizationId: string;
  propertyId: string;
  capabilityHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface ReservationIdempotencyRecord {
  idempotencyId: string;
  organizationId: string;
  propertyId: string;
  requestHash: string;
  reservation: Reservation;
  createdAt: string;
}

export type PaymentProvider = 'stripe' | 'mercadopago' | 'picpay';
export type PaymentMethod = 'card' | 'pix';
export type CanonicalPaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';

/** Provider-neutral, server-owned financial record. Presentation data is
 * intentionally limited to data required to resume a public checkout. */
export interface PaymentRecord {
  paymentId: string;
  reservationId: string;
  organizationId: string;
  propertyId: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  providerPaymentId: string;
  providerReference: string;
  /** Hash of the client-supplied idempotency key; never persist the raw key. */
  idempotencyKeyHash: string;
  amount: number;
  currency: 'brl';
  status: CanonicalPaymentStatus;
  providerStatus?: string;
  presentation?: {
    clientSecret?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    expiresAt?: string;
  };
  paidAt?: string;
  /** Compatibility only; canonical integrations must use providerPaymentId. */
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCanonicalPaymentRequest {
  provider: PaymentProvider;
  method: PaymentMethod;
  /** Tokenized or payer data accepted by the selected provider only. Values
   * that represent amount, currency, tenant or payment status are ignored. */
  providerData?: Record<string, unknown>;
}
