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

export interface PaymentRecord {
  reservationId: string;
  organizationId: string;
  propertyId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: 'brl';
  status: 'created' | 'succeeded' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
