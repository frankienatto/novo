import type { Booking } from '../../types';

export interface CanonicalReservation {
  reservationId: string;
  unitId: string;
  propertyId: string;
  guest: { guestId: string; fullName: string; email: string; phone?: string };
  stayPeriod: { checkInDate: string; checkOutDate: string };
  adultsCount: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  source: string;
  paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'refunded';
  totalAmount: number;
  balance?: number;
}

const bookingStatus: Record<CanonicalReservation['status'], Booking['status']> = {
  pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked-in', checked_out: 'Checked-out', cancelled: 'Cancelled', no_show: 'Cancelled',
};

export function adaptCanonicalReservation(reservation: CanonicalReservation): Booking {
  return {
    id: reservation.reservationId,
    guestId: reservation.guest.guestId,
    roomId: reservation.unitId,
    ratePlanId: 'canonical',
    checkIn: reservation.stayPeriod.checkInDate,
    checkOut: reservation.stayPeriod.checkOutDate,
    numGuests: reservation.adultsCount,
    totalPrice: reservation.totalAmount,
    balance: reservation.balance ?? reservation.totalAmount,
    status: bookingStatus[reservation.status],
    source: 'Website',
    paymentStatus: reservation.paymentStatus === 'paid' ? 'Paid' : 'Pending',
    propertyId: reservation.propertyId as Booking['propertyId'],
  };
}
