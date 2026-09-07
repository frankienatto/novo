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
 * Middleware de Autorização de Tenant & Propriedade Server-Side.
 * Garante o isolamento estrito de Tenant e Propriedade ativa com base na identidade autenticada (req.saasUser).
 * Rejeita qualquer tentativa do cliente de acessar organizações ou propriedades não autorizadas.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.saasUser) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Identidade de usuário não encontrada para validação de tenant.'
      });
    }

    const canonicalOrgId = req.saasUser.organizationId;
    if (!canonicalOrgId) {
      return res.status(403).json({
        error: 'Acesso Negado',
        message: 'Usuário não possui uma organização vinculada.'
      });
    }

    // 1. Validar se o cliente tentou enviar um organizationId conflitante no header, query ou body
    const headerOrgId = (req.headers['x-organization-id'] || req.headers['x-tenant-id']) as string | undefined;
    const queryOrgId = req.query?.organizationId as string | undefined;
    const bodyOrgId = req.body?.organizationId as string | undefined;

    const attemptedOrgId = headerOrgId || queryOrgId || bodyOrgId;
    if (attemptedOrgId && typeof attemptedOrgId === 'string' && attemptedOrgId !== canonicalOrgId) {
      return res.status(403).json({
        error: 'Acesso Negado',
        message: `Tentativa não autorizada de acessar a organização ${attemptedOrgId}.`
      });
    }

    // 2. Resolver e validar a propriedade solicitada
    const headerPropId = req.headers['x-property-id'] as string | undefined;
    const queryPropId = req.query?.propertyId as string | undefined;
    const bodyPropId = req.body?.propertyId as string | undefined;

    const requestedPropId = headerPropId || queryPropId || bodyPropId;
    const userPropertyIds = req.saasUser.propertyIds || [];

    let activePropId: string | undefined;

    if (requestedPropId && typeof requestedPropId === 'string') {
      const isWildcard = userPropertyIds.includes('*');
      const isAuthorized = isWildcard || userPropertyIds.includes(requestedPropId);

      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Acesso Negado',
          message: `Propriedade ${requestedPropId} não autorizada para este usuário.`
        });
      }
      activePropId = requestedPropId;
    } else {
      activePropId = userPropertyIds[0];
    }

    if (!activePropId) {
      return res.status(403).json({
        error: 'Acesso Negado',
        message: 'Nenhuma propriedade autorizada atribuída a este usuário.'
      });
    }

    // 3. Verifica se a organização existe e está ativa
    const org = await organizationRepository.getOrganizationById(canonicalOrgId);
    if (!org || org.status !== 'active') {
      return res.status(403).json({
        error: 'Organização Inativa',
        message: `A organização ${canonicalOrgId} não está ativa no sistema.`
      });
    }

    req.organizationId = canonicalOrgId;
    req.propertyId = activePropId;

    return next();
  } catch (err: any) {
    console.error('❌ [TenantMiddleware] Erro:', err?.message || err);
    return res.status(500).json({ error: 'Erro interno na validação de Tenant.' });
  }
}

