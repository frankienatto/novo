import { Router, Request, Response } from 'express';
import { executiveService } from './executiveService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const executiveRouter = Router();

// Aplica rate-limiting de REST
executiveRouter.use(rateLimiters.rest);

/**
 * Extrai cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/executive/dashboard
 * Retorna o painel consolidado do Executive Intelligence
 */
executiveRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await executiveService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard executivo.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive/kpis
 * Retorna os KPIs executivos consolidados
 */
executiveRouter.get('/kpis', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const kpis = await executiveService.getKpis(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: kpis
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter KPIs executivos.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive/alerts
 * Retorna os alertas operacionais e estratégicos executivos
 */
executiveRouter.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const alerts = await executiveService.getAlerts(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: alerts.length,
      data: alerts
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter alertas executivos.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive/priorities
 * Retorna as prioridades e riscos operacionais do dia
 */
executiveRouter.get('/priorities', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const priorities = await executiveService.getPriorities(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: priorities
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter prioridades executivas.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive/summary
 * Retorna o resumo consolidados por módulos
 */
executiveRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const summary = await executiveService.getSummaryModule(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter resumo executivo.',
      details: err?.message || String(err)
    });
  }
});
