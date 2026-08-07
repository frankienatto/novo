export interface ICalEvent {
  uid: string;
  dtstart: string; // ISO date format YYYY-MM-DD
  dtend: string;   // ISO date format YYYY-MM-DD
  summary: string;
  description?: string;
  location?: string;
  status?: string;
  lastModified?: string;
  rawAttributes?: Record<string, string>;
}

export interface ICalParseResult {
  success: boolean;
  totalEventsFound: number;
  events: ICalEvent[];
  error?: string;
}

export interface ICalGenerateOptions {
  propertyName: string;
  organizationId: string;
  propertyId: string;
  unitId?: string;
  unitNumber?: string;
}

export interface ICalFeedSummary {
  propertyId: string;
  activeFeedsCount: number;
  lastExportedAt?: string;
  lastImportedAt?: string;
}
