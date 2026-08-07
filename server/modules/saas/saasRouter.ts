import { Router, Request, Response } from 'express';
import { organizationService } from './organizationService';
import { integrationRegistry } from './integrationRegistry';
import { authMiddleware } from './middlewares/authMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';
import { requirePermission } from './middlewares/rbacMiddleware';
import { OnboardingPayload, IntegrationProvider } from './saasTypes';

export const saasRouter = Router();

/**
 * Public Endpoint: Onboarding de Novo Tenant
 * Cria Organization, Property e Owner User. Retorna estrutura com onboardingStatus e nextSteps.
 */
saasRouter.post('/api/saas/onboarding', async (req: Request, res: Response) => {
  try {
    const payload: OnboardingPayload = req.body;
    const result = await organizationService.processOnboarding(payload);
    return res.status(201).json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('❌ [SaasRouter] Erro no Onboarding:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Falha no Onboarding',
      message: err.message
    });
  }
});

// --- Rotas Autenticadas com Resolução de Tenant ---
const saasProtected = [authMiddleware, tenantMiddleware];

/**
 * Visão Geral da Organização Ativa
 */
saasRouter.get('/api/saas/organization', saasProtected, async (req: Request, res: Response) => {
  try {
    const overview = await organizationService.getOrganizationOverview(req.organizationId!);
    return res.status(200).json({
      success: true,
      data: overview
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
});

/**
 * Gestão de Propriedades
 */
saasRouter.get('/api/saas/properties', saasProtected, async (req: Request, res: Response) => {
  try {
    const overview = await organizationService.getOrganizationOverview(req.organizationId!);
    return res.status(200).json({
      success: true,
      data: overview.properties
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

saasRouter.post(
  '/api/saas/properties', 
  [...saasProtected, requirePermission('manage_properties')], 
  async (req: Request, res: Response) => {
    try {
      const { name, type } = req.body;
      if (!name) {
        return res.status(400).json({ error: "O campo 'name' da propriedade é obrigatório." });
      }
      const newProperty = await organizationService.addProperty(req.organizationId!, name, type || 'pousada');
      return res.status(201).json({
        success: true,
        data: newProperty
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

/**
 * Gestão de Usuários e RBAC
 */
saasRouter.get(
  '/api/saas/users', 
  [...saasProtected, requirePermission('manage_users')], 
  async (req: Request, res: Response) => {
    try {
      const overview = await organizationService.getOrganizationOverview(req.organizationId!);
      return res.status(200).json({
        success: true,
        data: overview.users
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

saasRouter.post(
  '/api/saas/users', 
  [...saasProtected, requirePermission('manage_users')], 
  async (req: Request, res: Response) => {
    try {
      const { name, email, role, propertyIds } = req.body;
      if (!name || !email || !role) {
        return res.status(400).json({ error: "Campos obrigatórios: name, email, role." });
      }
      const newUser = await organizationService.addUser(
        req.organizationId!, 
        name, 
        email, 
        role, 
        propertyIds || [req.propertyId!]
      );
      return res.status(201).json({
        success: true,
        data: newUser
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

/**
 * Registro de Integrações (Armazenamento de Metadados / Status)
 */
saasRouter.get('/api/saas/integrations', saasProtected, async (req: Request, res: Response) => {
  try {
    const list = await integrationRegistry.listIntegrations(req.organizationId!);
    return res.status(200).json({
      success: true,
      data: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

saasRouter.post(
  '/api/saas/integrations', 
  [...saasProtected, requirePermission('manage_integrations')], 
  async (req: Request, res: Response) => {
    try {
      const { provider, type, config, metadata, propertyId } = req.body;
      if (!provider) {
        return res.status(400).json({ error: "O parâmetro 'provider' é obrigatório." });
      }
      const integration = await integrationRegistry.registerIntegration(
        req.organizationId!,
        provider as IntegrationProvider,
        type || provider,
        config || {},
        propertyId || req.propertyId,
        metadata || {}
      );
      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);
