export type RecurrenceLevel = 'new' | 'occasional' | 'frequent' | 'champion';

export interface GuestIntelligence {
  guestId: string;
  fullName: string;
  organizationId: string;
  profileSummary: string;
  engagementScore: number; // 0 a 100
  recurrenceLevel: RecurrenceLevel;
  totalStays: number;
  daysSinceLastStay: number | null;
  averageSpendPerStay: number;
  totalRevenueGenerated: number;
  averageStayDays: number;
  preferredBookingChannel: string;
  preferredRoomCategory: string;
  preferredLanguage: string;
  topPreferences: string[];
  operationalAlerts: string[];
  conciergeSuggestions: string[];
  calculatedAt: string;
}

export interface GuestSummary {
  guestId: string;
  fullName: string;
  classification: string;
  engagementScore: number;
  recurrenceLevel: RecurrenceLevel;
  profileSummary: string;
  topPreferences: string[];
  operationalAlerts: string[];
}
