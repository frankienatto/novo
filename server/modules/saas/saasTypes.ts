export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'receptionist' 
  | 'housekeeping' 
  | 'financial';

export type Permission = 
  | 'manage_org' 
  | 'manage_properties' 
  | 'manage_users' 
  | 'manage_integrations' 
  | 'view_dashboard' 
  | 'manage_bookings' 
  | 'view_financials';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: ['manage_org', 'manage_properties', 'manage_users', 'manage_integrations', 'view_dashboard', 'manage_bookings', 'view_financials'],
  admin: ['manage_properties', 'manage_users', 'manage_integrations', 'view_dashboard', 'manage_bookings', 'view_financials'],
  manager: ['manage_users', 'view_dashboard', 'manage_bookings', 'view_financials'],
  receptionist: ['view_dashboard', 'manage_bookings'],
  housekeeping: ['view_dashboard'],
  financial: ['view_dashboard', 'view_financials']
};

export interface Organization {
  organizationId: string;
  name: string;
  document?: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  propertyId: string;
  organizationId: string;
  name: string;
  type: 'hotel' | 'pousada' | 'resort' | 'hostel' | 'chalet' | 'apartment';
  address?: string;
  roomsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSUser {
  userId: string;
  organizationId: string;
  propertyIds: string[];
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider = 
  | 'google_workspace' 
  | 'google_drive' 
  | 'google_calendar' 
  | 'gmail' 
  | 'google_sheets' 
  | 'whatsapp' 
  | 'stripe' 
  | 'mercadopago' 
  | 'n8n' 
  | 'custom';

export interface IntegrationConfig {
  integrationId: string;
  organizationId: string;
  propertyId?: string;
  type: string;
  provider: IntegrationProvider;
  status: 'connected' | 'disconnected' | 'pending';
  config: Record<string, any>;
  connectedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingPayload {
  organizationName: string;
  propertyName: string;
  propertyType: 'hotel' | 'pousada' | 'resort' | 'hostel' | 'chalet' | 'apartment';
  ownerName: string;
  ownerEmail: string;
  document?: string;
}

export interface OnboardingResponse {
  organization: Organization;
  property: Property;
  owner: SaaSUser;
  onboardingStatus: 'completed';
  nextSteps: string[];
}
