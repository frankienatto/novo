export type N8nEventType = 
  | 'reservation.created'
  | 'reservation.updated'
  | 'reservation.cancelled'
  | 'unit.status_changed'
  | 'ical.sync_requested'
  | 'gcal.sync_requested';

export interface N8nWebhookPayload<T = any> {
  eventId: string;
  eventType: N8nEventType;
  timestamp: string;
  organizationId: string;
  propertyId: string;
  sourceSystem: 'aloha' | 'n8n' | 'ical' | 'gcal' | string;
  payload: T;
}

export interface AlohaReservationPayload {
  alohaReservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  documentId?: string;
  unitNumber?: string;
  unitId?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  totalAmount?: number;
  adultsCount?: number;
  childrenCount?: number;
  sourceChannel?: string; // ex: 'Booking.com', 'Airbnb', 'Aloha'
  status?: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  notes?: string;
}

export interface AlohaUnitStatusPayload {
  unitNumber?: string;
  unitId?: string;
  newStatus: 'clean' | 'dirty' | 'inspected' | 'maintenance' | 'out_of_service';
  notes?: string;
}

export interface IngestionResult {
  success: boolean;
  eventId: string;
  eventType: N8nEventType;
  timestamp: string;
  processedEntityId?: string;
  message: string;
  details?: Record<string, any>;
}

export interface N8nSyncLog {
  id: string;
  eventId: string;
  organizationId: string;
  propertyId: string;
  eventType: N8nEventType;
  sourceSystem: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface ICalSyncConfig {
  propertyId: string;
  unitId?: string;
  feedUrl?: string;
  lastSyncedAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
}

export interface GCalSyncConfig {
  propertyId: string;
  calendarId?: string;
  lastSyncedAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
}
