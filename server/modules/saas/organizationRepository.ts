import { 
  Organization, 
  Property, 
  SaaSUser, 
  IntegrationConfig 
} from './saasTypes';
import { getAdminFirestore } from '../../config/firebaseAdmin';

export class OrganizationRepository {
  private get db() {
    return getAdminFirestore();
  }

  // --- Organizations ---
  async saveOrganization(org: Organization): Promise<Organization> {
    await this.db.collection('organizations').doc(org.organizationId).set(org, { merge: true });
    return org;
  }

  async createOrganization(org: Organization): Promise<Organization> {
    return this.saveOrganization(org);
  }

  async updateOrganization(org: Organization): Promise<Organization> {
    return this.saveOrganization(org);
  }

  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    if (!organizationId) return null;
    const docSnap = await this.db.collection('organizations').doc(organizationId).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as Organization;
  }

  async deleteOrganization(organizationId: string): Promise<boolean> {
    if (!organizationId) return false;
    await this.db.collection('organizations').doc(organizationId).delete();
    return true;
  }

  async listOrganizations(): Promise<Organization[]> {
    const snap = await this.db.collection('organizations').get();
    return snap.docs.map(doc => doc.data() as Organization);
  }

  // --- Properties ---
  async saveProperty(property: Property): Promise<Property> {
    await this.db.collection('properties').doc(property.propertyId).set(property, { merge: true });
    return property;
  }

  async createProperty(property: Property): Promise<Property> {
    return this.saveProperty(property);
  }

  async updateProperty(property: Property): Promise<Property> {
    return this.saveProperty(property);
  }

  async getPropertyById(propertyId: string): Promise<Property | null> {
    if (!propertyId) return null;
    const docSnap = await this.db.collection('properties').doc(propertyId).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as Property;
  }

  async getPropertiesByOrganizationId(organizationId: string): Promise<Property[]> {
    if (!organizationId) return [];
    const snap = await this.db.collection('properties').where('organizationId', '==', organizationId).get();
    return snap.docs.map(doc => doc.data() as Property);
  }

  async deleteProperty(propertyId: string): Promise<boolean> {
    if (!propertyId) return false;
    await this.db.collection('properties').doc(propertyId).delete();
    return true;
  }

  async listProperties(): Promise<Property[]> {
    const snap = await this.db.collection('properties').get();
    return snap.docs.map(doc => doc.data() as Property);
  }

  // --- Users ---
  async saveUser(user: SaaSUser): Promise<SaaSUser> {
    await this.db.collection('users').doc(user.userId).set(user, { merge: true });
    return user;
  }

  async createUser(user: SaaSUser): Promise<SaaSUser> {
    return this.saveUser(user);
  }

  async updateUser(user: SaaSUser): Promise<SaaSUser> {
    return this.saveUser(user);
  }

  async getUserById(userId: string): Promise<SaaSUser | null> {
    if (!userId) return null;
    const docSnap = await this.db.collection('users').doc(userId).get();
    if (!docSnap.exists) return null;
    return docSnap.data() as SaaSUser;
  }

  async getUserByEmail(email: string): Promise<SaaSUser | null> {
    if (!email) return null;
    const snap = await this.db.collection('users').where('email', '==', email).get();
    if (snap.empty) {
      const snapLower = await this.db.collection('users').where('email', '==', email.toLowerCase()).get();
      if (snapLower.empty) return null;
      return snapLower.docs[0].data() as SaaSUser;
    }
    return snap.docs[0].data() as SaaSUser;
  }

  async getUsersByOrganizationId(organizationId: string): Promise<SaaSUser[]> {
    if (!organizationId) return [];
    const snap = await this.db.collection('users').where('organizationId', '==', organizationId).get();
    return snap.docs.map(doc => doc.data() as SaaSUser);
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    await this.db.collection('users').doc(userId).delete();
    return true;
  }

  // --- Integrations ---
  async saveIntegration(integration: IntegrationConfig): Promise<IntegrationConfig> {
    await this.db.collection('integrations').doc(integration.integrationId).set(integration, { merge: true });
    return integration;
  }

  async getIntegrationsByOrganizationId(organizationId: string): Promise<IntegrationConfig[]> {
    if (!organizationId) return [];
    const snap = await this.db.collection('integrations').where('organizationId', '==', organizationId).get();
    return snap.docs.map(doc => doc.data() as IntegrationConfig);
  }

  async deleteIntegration(integrationId: string): Promise<boolean> {
    if (!integrationId) return false;
    await this.db.collection('integrations').doc(integrationId).delete();
    return true;
  }

  // --- Optional Dev Seed Helper ---
  async seedDevData(): Promise<void> {
    const devOrgId = 'org_dev_default';
    const devPropertyId = 'prop_dev_default';
    const devUserId = 'user_dev_owner';

    const existingOrg = await this.getOrganizationById(devOrgId);
    if (!existingOrg) {
      await this.saveOrganization({
        organizationId: devOrgId,
        name: 'Forest House Group (Dev)',
        plan: 'pro',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const existingProp = await this.getPropertyById(devPropertyId);
    if (!existingProp) {
      await this.saveProperty({
        propertyId: devPropertyId,
        organizationId: devOrgId,
        name: 'Forest House Beach',
        type: 'pousada',
        roomsCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const existingUser = await this.getUserById(devUserId);
    if (!existingUser) {
      await this.saveUser({
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
  }
}

export const organizationRepository = new OrganizationRepository();
