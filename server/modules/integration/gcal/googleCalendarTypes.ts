export type GCalEventType = 
  | 'reservation.created'
  | 'reservation.updated'
  | 'reservation.cancelled'
  | 'room.blocked'
  | 'room.maintenance'
  | 'housekeeping.task'
  | 'custom.calendar.event';

export interface GCalEventPayload {
  eventId: string;
  gcalEventId?: string;
  eventType: GCalEventType;
  eventVersion: number;
  calendarId?: string;
  title: string;
  description?: string;
  startTime: string; // ISO String ou YYYY-MM-DD
  endTime: string;   // ISO String ou YYYY-MM-DD
  unitId?: string;
  unitNumber?: string;
  status: 'active' | 'cancelled' | 'tentative';
  metadata?: Record<string, any>;
}

export interface GCalSyncRequest {
  eventId: string;
  eventType: GCalEventType;
  organizationId: string;
  propertyId: string;
  sourceSystem?: string;
  payload: GCalEventPayload;
}

export interface GCalSyncLog {
  id: string;
  eventId: string;
  organizationId: string;
  propertyId: string;
  eventType: GCalEventType;
  gcalEventId?: string;
  eventVersion: number;
  status: 'SUCCESS' | 'ERROR' | 'IGNORED_DUPLICATE' | 'OUT_OF_ORDER';
  message: string;
  createdAt: string;
}

export interface GCalSyncStatus {
  organizationId: string;
  propertyId: string;
  calendarId?: string;
  totalSyncedEvents: number;
  pendingEventsCount: number;
  hasErrors: boolean;
  lastSyncStatus: 'IDLE' | 'SUCCESS' | 'ERROR';
  lastSyncedAt?: string;
}

export interface GCalSyncResponse {
  success: boolean;
  eventId: string;
  eventType: GCalEventType;
  gcalEventId?: string;
  status: 'SUCCESS' | 'ERROR' | 'IGNORED_DUPLICATE' | 'OUT_OF_ORDER';
  message: string;
  processedEntityId?: string;
  timestamp: string;
}
