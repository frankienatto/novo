import { Router, Request, Response } from 'express';
import { executiveCopilotService } from './executiveCopilotService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const executiveCopilotRouter = Router();

// Aplica rate-limiting de REST
executiveCopilotRouter.use(rateLimiters.rest);

/**
 * Extrai cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/executive-copilot/dashboard
 * Retorna o painel consolidado do Executive Copilot
 */
executiveCopilotRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await executiveCopilotService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard do Executive Copilot.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive-copilot/summary
 * Retorna o resumo executivo compacto
 */
executiveCopilotRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const summary = await executiveCopilotService.getSummary(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter resumo do Executive Copilot.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive-copilot/health
 * Retorna o breakdown de health scores por setor
 */
executiveCopilotRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const health = await executiveCopilotService.getHealth(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: health
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter scores de saúde executiva.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive-copilot/risks
 * Retorna os top 10 riscos operacionais e estratégicos
 */
executiveCopilotRouter.get('/risks', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const risks = await executiveCopilotService.getRisks(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: risks.length,
      data: risks
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter riscos executivos.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive-copilot/opportunities
 * Retorna as top 10 oportunidades estratégicas
 */
executiveCopilotRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const opportunities = await executiveCopilotService.getOpportunities(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: opportunities.length,
      data: opportunities
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter oportunidades executivas.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/executive-copilot/brief
 * Retorna o Executive Daily Brief
 */
executiveCopilotRouter.get('/brief', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const brief = await executiveCopilotService.getBrief(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: brief
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter Executive Daily Brief.',
      details: err?.message || String(err)
    });
  }
});
