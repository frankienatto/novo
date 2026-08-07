import { Request, Response, NextFunction } from 'express';
import { organizationRepository } from '../organizationRepository';

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      propertyId?: string;
    }
  }
}

/**
 * Middleware com responsabilidade única: Tenant & Property Resolution.
 * Identifica e isola os dados da organização (Tenant) e propriedade ativa.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const headerOrgId = (req.headers['x-organization-id'] || req.headers['x-tenant-id']) as string;
    const headerPropId = req.headers['x-property-id'] as string;

    // 1. Prioriza o organizationId resolvido do usuário autenticado se presente
    let activeOrgId = req.saasUser?.organizationId || headerOrgId;
    let activePropId = headerPropId || (req.saasUser?.propertyIds?.[0]);

    // 2. Em produção, obriga a presença explícita de um tenantId
    if (!activeOrgId) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          error: 'Tenant Não Identificado',
          message: 'O cabeçalho x-organization-id ou x-tenant-id é obrigatório em ambiente de produção.'
        });
      } else {
        // Fallback exclusivo para ambiente de desenvolvimento
        activeOrgId = 'org_dev_default';
        activePropId = activePropId || 'prop_dev_default';
      }
    }

    // 3. Verifica se a organização existe no repositório
    const org = await organizationRepository.getOrganizationById(activeOrgId);
    if (!org || org.status !== 'active') {
      return res.status(403).json({
        error: 'Organização Inválida ou Suspensa',
        message: `A organização ${activeOrgId} não está ativa no sistema.`
      });
    }

    req.organizationId = activeOrgId;
    req.propertyId = activePropId;

    return next();
  } catch (err: any) {
    console.error('❌ [TenantMiddleware] Erro:', err.message);
    return res.status(500).json({ error: 'Erro na resolução do Tenant.' });
  }
}
