export interface ReceptionDashboardSummary {
  checkinsExpectedToday: number;
  checkoutsExpectedToday: number;
  guestsInHouse: number;
  lateArrivals: number;
  pendingEarlyCheckins: number;
  pendingLateCheckouts: number;
  availableRooms: number;
  dirtyRooms: number;
  blockedRooms: number;
  maintenanceRooms: number;
  occupancyRatePercent: number;
}

export interface ReceptionCheckinItem {
  reservationId: string;
  guestName: string;
  guestId?: string;
  unitId?: string;
  unitNumber?: string;
  categoryName?: string;
  stayPeriod: {
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
  };
  status: string;
  cleaningStatus?: string;
  isVip: boolean;
  isRecurring: boolean;
  isLateArrival: boolean;
  isEarlyCheckinRequested: boolean;
  specialRequests?: string[];
  totalAmount: number;
}

export interface ReceptionCheckoutItem {
  reservationId: string;
  guestName: string;
  guestId?: string;
  unitId?: string;
  unitNumber?: string;
  stayPeriod: {
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
  };
  status: string;
  paymentStatus: string;
  totalAmount: number;
  isLateCheckoutRequested: boolean;
}

export type ReceptionSuggestionType =
  | 'vip'
  | 'recurring'
  | 'returning'
  | 'birthday'
  | 'special_preference'
  | 'upgrade'
  | 'upsell'
  | 'operational_alert';

export interface ReceptionSmartSuggestion {
  id: string;
  type: ReceptionSuggestionType;
  title: string;
  description: string;
  reservationId?: string;
  guestId?: string;
  guestName?: string;
  unitNumber?: string;
  actionableHint?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ReceptionDashboardData {
  summary: ReceptionDashboardSummary;
  checkinsToday: ReceptionCheckinItem[];
  checkoutsToday: ReceptionCheckoutItem[];
  suggestions: ReceptionSmartSuggestion[];
  alerts: ReceptionSmartSuggestion[];
  vips: ReceptionCheckinItem[];
}
