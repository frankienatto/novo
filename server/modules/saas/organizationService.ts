import { 
  OnboardingPayload, 
  OnboardingResponse, 
  Organization, 
  Property, 
  SaaSUser, 
  ROLE_PERMISSIONS,
  UserRole
} from './saasTypes';
import { organizationRepository } from './organizationRepository';

function generateUniqueId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export class OrganizationService {
  /**
   * Processa o onboarding de um novo cliente SaaS.
   * Cria estritamente: Organization, Property e Owner User (sem criar agentes automaticamente).
   */
  async processOnboarding(payload: OnboardingPayload): Promise<OnboardingResponse> {
    if (!payload.organizationName || !payload.propertyName || !payload.ownerEmail) {
      throw new Error("Campos obrigatórios ausentes para onboarding: organizationName, propertyName, ownerEmail.");
    }

    const existingUser = await organizationRepository.getUserByEmail(payload.ownerEmail);
    if (existingUser) {
      throw new Error(`Já existe uma conta cadastrada para o e-mail: ${payload.ownerEmail}`);
    }

    const now = new Date().toISOString();
    const organizationId = generateUniqueId('org');
    const propertyId = generateUniqueId('prop');
    const userId = generateUniqueId('user');

    // 1. Criar Organização (Tenant)
    const newOrg: Organization = {
      organizationId,
      name: payload.organizationName,
      document: payload.document,
      plan: 'trial',
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    await organizationRepository.saveOrganization(newOrg);

    // 2. Criar Primeira Propriedade
    const newProperty: Property = {
      propertyId,
      organizationId,
      name: payload.propertyName,
      type: payload.propertyType || 'pousada',
      createdAt: now,
      updatedAt: now
    };
    await organizationRepository.saveProperty(newProperty);

    // 3. Criar Usuário Proprietário (Owner)
    const newOwner: SaaSUser = {
      userId,
      organizationId,
      propertyIds: [propertyId],
      name: payload.ownerName,
      email: payload.ownerEmail.toLowerCase(),
      role: 'owner',
      permissions: ROLE_PERMISSIONS.owner,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    await organizationRepository.saveUser(newOwner);

    return {
      organization: newOrg,
      property: newProperty,
      owner: newOwner,
      onboardingStatus: 'completed',
      nextSteps: [
        'Conectar canais de integração no Integration Hub (Google, WhatsApp, Stripe)',
        'Cadastrar acomodações e tarifário base',
        'Ativar agentes de inteligência no AI Center'
      ]
    };
  }

  async getOrganizationOverview(organizationId: string) {
    const org = await organizationRepository.getOrganizationById(organizationId);
    if (!org) {
      throw new Error(`Organização não encontrada para ID: ${organizationId}`);
    }

    const properties = await organizationRepository.getPropertiesByOrganizationId(organizationId);
    const users = await organizationRepository.getUsersByOrganizationId(organizationId);
    const integrations = await organizationRepository.getIntegrationsByOrganizationId(organizationId);

    return {
      organization: org,
      properties,
      users,
      integrations
    };
  }

  async addProperty(organizationId: string, name: string, type: any): Promise<Property> {
    const now = new Date().toISOString();
    const propertyId = generateUniqueId('prop');

    const property: Property = {
      propertyId,
      organizationId,
      name,
      type,
      createdAt: now,
      updatedAt: now
    };

    return await organizationRepository.saveProperty(property);
  }

  async addUser(
    organizationId: string, 
    name: string, 
    email: string, 
    role: UserRole, 
    propertyIds: string[]
  ): Promise<SaaSUser> {
    const existing = await organizationRepository.getUserByEmail(email);
    if (existing) {
      throw new Error(`E-mail já cadastrado: ${email}`);
    }

    const now = new Date().toISOString();
    const userId = generateUniqueId('user');

    const user: SaaSUser = {
      userId,
      organizationId,
      propertyIds,
      name,
      email: email.toLowerCase(),
      role,
      permissions: ROLE_PERMISSIONS[role] || [],
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    return await organizationRepository.saveUser(user);
  }
}

export const organizationService = new OrganizationService();
