import { IntegrationConfig, IntegrationProvider } from './saasTypes';
import { organizationRepository } from './organizationRepository';

function generateUniqueId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export class IntegrationRegistry {
  /**
   * Registra ou atualiza metadados de uma integração para uma organização/propriedade.
   * Não executa conexão OAuth nem autenticação externa neste Milestone.
   */
  async registerIntegration(
    organizationId: string,
    provider: IntegrationProvider,
    type: string,
    config: Record<string, any> = {},
    propertyId?: string,
    metadata: Record<string, any> = {}
  ): Promise<IntegrationConfig> {
    const existingList = await organizationRepository.getIntegrationsByOrganizationId(organizationId);
    const existing = existingList.find(i => i.provider === provider && i.propertyId === propertyId);

    const now = new Date().toISOString();
    const integrationId = existing ? existing.integrationId : generateUniqueId('integ');

    const integration: IntegrationConfig = {
      integrationId,
      organizationId,
      propertyId,
      type: type || provider,
      provider,
      status: 'connected',
      config,
      connectedAt: now,
      metadata,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    return await organizationRepository.saveIntegration(integration);
  }

  async listIntegrations(organizationId: string): Promise<IntegrationConfig[]> {
    return await organizationRepository.getIntegrationsByOrganizationId(organizationId);
  }

  async disconnectIntegration(organizationId: string, integrationId: string): Promise<IntegrationConfig | null> {
    const list = await organizationRepository.getIntegrationsByOrganizationId(organizationId);
    const target = list.find(i => i.integrationId === integrationId);

    if (!target) {
      return null;
    }

    target.status = 'disconnected';
    target.updatedAt = new Date().toISOString();
    return await organizationRepository.saveIntegration(target);
  }
}

export const integrationRegistry = new IntegrationRegistry();
