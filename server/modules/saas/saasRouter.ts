import { Router, Request, Response } from 'express';
import { organizationService } from './organizationService';
import { integrationRegistry } from './integrationRegistry';
import { authMiddleware } from './middlewares/authMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';
import { requirePermission } from './middlewares/rbacMiddleware';
import { IntegrationProvider } from './saasTypes';

export const saasRouter = Router();

/**
 * A generic unauthenticated tenant creator is not a valid bootstrap boundary.
 * Staging uses the separately guarded, one-time server-side route. Future SaaS
 * onboarding must be introduced through an authorised invitation flow.
 */
saasRouter.post('/onboarding', (_req: Request, res: Response) => {
  return res.status(410).json({
    error: 'SAAS_ONBOARDING_RETIRED',
    message: 'O onboarding de tenant requer fluxo server-side autorizado.'
  });
});

// --- Rotas Autenticadas com Resolução de Tenant ---
const saasProtected = [authMiddleware, tenantMiddleware];

/** Session projection used by the browser after Firebase sign-in. Tenant and
 * property are derived from verified server context, never browser storage. */
saasRouter.get('/session', saasProtected, (req: Request, res: Response) => {
  const user = req.saasUser!;
  return res.status(200).json({
    success: true,
    data: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      organizationId: req.organizationId,
      propertyId: req.propertyId,
    },
  });
});

/**
 * Visão Geral da Organização Ativa
 */
saasRouter.get('/organization', saasProtected, async (req: Request, res: Response) => {
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
saasRouter.get('/properties', saasProtected, async (req: Request, res: Response) => {
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
  '/properties',
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
  '/users',
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
  '/users',
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
saasRouter.get('/integrations', saasProtected, async (req: Request, res: Response) => {
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
  '/integrations',
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
