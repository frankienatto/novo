import { 
  Organization, 
  Property, 
  SaaSUser, 
  IntegrationConfig 
} from './saasTypes';

class OrganizationRepository {
  private organizations: Map<string, Organization> = new Map();
  private properties: Map<string, Property> = new Map();
  private users: Map<string, SaaSUser> = new Map();
  private integrations: Map<string, IntegrationConfig> = new Map();

  constructor() {
    // Registra uma organização padrão para o ambiente de desenvolvimento local
    const devOrgId = 'org_dev_default';
    const devPropertyId = 'prop_dev_default';
    const devUserId = 'user_dev_owner';

    this.organizations.set(devOrgId, {
      organizationId: devOrgId,
      name: 'Forest House Group (Dev)',
      plan: 'pro',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.properties.set(devPropertyId, {
      propertyId: devPropertyId,
      organizationId: devOrgId,
      name: 'Forest House Beach',
      type: 'pousada',
      roomsCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.users.set(devUserId, {
      userId: devUserId,
      organizationId: devOrgId,
      propertyIds: [devPropertyId],
      name: 'Admin Forest House',
      email: 'admin@foresthouse.com',
      role: 'owner',
      permissions: ['manage_org', 'manage_properties', 'manage_users', 'manage_integrations', 'view_dashboard', 'manage_bookings', 'view_financials'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // --- Organizations ---
  async saveOrganization(org: Organization): Promise<Organization> {
    this.organizations.set(org.organizationId, org);
    return org;
  }

  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    return this.organizations.get(organizationId) || null;
  }

  // --- Properties ---
  async saveProperty(property: Property): Promise<Property> {
    this.properties.set(property.propertyId, property);
    return property;
  }

  async getPropertyById(propertyId: string): Promise<Property | null> {
    return this.properties.get(propertyId) || null;
  }

  async getPropertiesByOrganizationId(organizationId: string): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(p => p.organizationId === organizationId);
  }

  // --- Users ---
  async saveUser(user: SaaSUser): Promise<SaaSUser> {
    this.users.set(user.userId, user);
    return user;
  }

  async getUserById(userId: string): Promise<SaaSUser | null> {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email: string): Promise<SaaSUser | null> {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUsersByOrganizationId(organizationId: string): Promise<SaaSUser[]> {
    return Array.from(this.users.values()).filter(u => u.organizationId === organizationId);
  }

  // --- Integrations ---
  async saveIntegration(integration: IntegrationConfig): Promise<IntegrationConfig> {
    this.integrations.set(integration.integrationId, integration);
    return integration;
  }

  async getIntegrationsByOrganizationId(organizationId: string): Promise<IntegrationConfig[]> {
    return Array.from(this.integrations.values()).filter(i => i.organizationId === organizationId);
  }
}

export const organizationRepository = new OrganizationRepository();
