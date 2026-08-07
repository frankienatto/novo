export type TimelineEventSource = 
  | 'pms'
  | 'crm'
  | 'n8n'
  | 'aloha'
  | 'google_calendar'
  | 'ical'
  | 'ai_agent'
  | 'user'
  | 'system';

export type TimelineEventType =
  | 'reservation.created'
  | 'reservation.checkin'
  | 'reservation.checkout'
  | 'reservation.cancelled'
  | 'reservation.noshow'
  | 'unit.changed'
  | 'reception.note'
  | 'housekeeping.note'
  | 'housekeeping.task_created'
  | 'housekeeping.task_updated'
  | 'preference.updated'
  | 'classification.changed'
  | 'concierge.interaction'
  | 'aloha.imported_event'
  | 'custom.event';

export interface GuestTimelineEvent {
  eventId: string;
  guestId: string;
  organizationId: string;
  propertyId?: string;
  source: TimelineEventSource;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  reservationId?: string;
  unitId?: string;
  unitNumber?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AppendTimelineEventDTO {
  organizationId: string;
  propertyId?: string;
  source: TimelineEventSource;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  reservationId?: string;
  unitId?: string;
  unitNumber?: string;
  metadata?: Record<string, unknown>;
}

export interface Guest360Profile {
  guest: any; // GuestProfile
  timeline: GuestTimelineEvent[];
  timelineTotalCount: number;
}

export interface GuestTimelineSummary {
  guestId: string;
  fullName: string;
  classification: string;
  totalStaysCount: number;
  lastStayDate?: string;
  mainPreferences: string[];
  recentEvents: GuestTimelineEvent[]; // Máximo 5 eventos mais recentes
  alerts: string[];
}
