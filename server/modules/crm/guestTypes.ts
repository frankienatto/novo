export type GuestClassification = 'standard' | 'frequent' | 'vip' | 'blacklisted' | 'corporate';

export interface GuestPreferences {
  dietaryRestrictions?: string[];
  pillowType?: string;
  preferredTemperatureCelsius?: number;
  floorPreference?: 'low' | 'high' | 'any';
  quietRoomRequested?: boolean;
  specialNeeds?: string;
  generalNotes?: string;
}

export interface GuestDocument {
  type: 'cpf' | 'rg' | 'passport' | 'other';
  number: string;
  issuingCountry?: string;
  expirationDate?: string;
}

export interface GuestStayRecord {
  stayId: string;
  propertyId: string;
  reservationId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  unitNumber?: string;
  roomCategoryName?: string;
  totalSpentAmount: number;
  bookingChannel: string;
  guestRating?: number; // 1 a 5
  notes?: string;
  createdAt: string;
}

export interface GuestProfile {
  guestId: string;
  organizationId: string; // Perfil unificado em nível de Organização
  fullName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  primaryLanguage: string; // e.g. "pt-BR", "en-US", "es-ES"
  nationality: string;
  classification: GuestClassification;
  tags: string[];
  documents: GuestDocument[];
  preferences: GuestPreferences;
  stayHistory: GuestStayRecord[];
  totalStaysCount: number;
  totalSpentAmount: number;
  lastStayDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestDTO {
  fullName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  primaryLanguage?: string;
  nationality?: string;
  classification?: GuestClassification;
  tags?: string[];
  documents?: GuestDocument[];
  preferences?: GuestPreferences;
}

export interface UpdateGuestDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  primaryLanguage?: string;
  nationality?: string;
  classification?: GuestClassification;
  tags?: string[];
  documents?: GuestDocument[];
  preferences?: GuestPreferences;
}

export interface GuestQueryFilters {
  search?: string;
  classification?: GuestClassification;
  tag?: string;
  minStays?: number;
  propertyId?: string; // Filtrar histórico de estadias por propriedade específica
}

export interface GuestMetricsSummary {
  organizationId: string;
  totalGuests: number;
  vipGuestsCount: number;
  frequentGuestsCount: number;
  totalStaysRecorded: number;
  totalRevenueGenerated: number;
}
