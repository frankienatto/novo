import { Router, Request, Response } from 'express';
import { decisionService } from './decisionService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const decisionRouter = Router();

// Aplica rate-limiting de REST
decisionRouter.use(rateLimiters.rest);

/**
 * Extrai cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/decision/dashboard
 * Retorna o painel consolidado do Decision Engine e Fila de Ações
 */
decisionRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await decisionService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard do Decision Engine.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/decision/recommendations
 * Retorna as recomendações pendentes de aprovação humana
 */
decisionRouter.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const recommendations = await decisionService.getRecommendations(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: recommendations.length,
      data: recommendations
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter recomendações do Decision Engine.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/decision/priorities
 * Retorna as prioridades diárias e gargalos críticos
 */
decisionRouter.get('/priorities', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const priorities = await decisionService.getPriorities(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: priorities
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter prioridades do Decision Engine.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/decision/summary
 * Retorna o resumo das recomendações
 */
decisionRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const summary = await decisionService.getSummary(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter resumo do Decision Engine.',
      details: err?.message || String(err)
    });
  }
});
