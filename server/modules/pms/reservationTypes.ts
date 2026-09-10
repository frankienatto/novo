export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type ReservationSource = 'direct_website' | 'front_desk' | 'phone' | 'whatsapp' | 'ota_generic';

export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'refunded';

export interface Guest {
  guestId: string;
  fullName: string;
  email: string;
  phone?: string;
  documentId?: string;
  documentType?: 'cpf' | 'rg' | 'passport' | 'other';
}

export interface StayPeriod {
  checkInDate: string;  // Formato YYYY-MM-DD
  checkOutDate: string; // Formato YYYY-MM-DD
  numberOfNights: number;
}

export interface Reservation {
  reservationId: string;
  organizationId: string;
  propertyId: string;
  unitId: string;        // UH vinculada
  categoryId: string;    // Categoria da UH
  guest: Guest;
  stayPeriod: StayPeriod;
  adultsCount: number;
  childrenCount: number;
  status: ReservationStatus;
  source: ReservationSource;
  paymentStatus: PaymentStatus;
  totalAmount: number;   // Cálculo da diária base * número de noites
  currency?: 'brl';
  amountPaid?: number;
  balance?: number;
  stripePaymentIntentId?: string;
  notes?: string;
  /** Guest-scoped pre-arrival metadata only. Document bytes/signatures are
   * deliberately excluded until a private upload/storage boundary exists. */
  preArrival?: {
    submittedAt: string;
    arrivalTime?: string;
    notes?: string;
    documentUploadStatus: 'not_configured' | 'pending' | 'uploaded';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDTO {
  unitId: string;
  guest: {
    guestId?: string;
    fullName: string;
    email: string;
    phone?: string;
    documentId?: string;
    documentType?: 'cpf' | 'rg' | 'passport' | 'other';
  };
  checkInDate: string;   // YYYY-MM-DD
  checkOutDate: string;  // YYYY-MM-DD
  adultsCount: number;
  childrenCount?: number;
  source?: ReservationSource;
  notes?: string;
}

export interface UpdateReservationDTO {
  guest?: Partial<Guest>;
  notes?: string;
}

export interface ReservationFilterDTO {
  unitId?: string;
  categoryId?: string;
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
  guestName?: string;
}
