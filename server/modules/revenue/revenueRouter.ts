import { Router, Request, Response } from 'express';
import { revenueService } from './revenueService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const revenueRouter = Router();

// Aplica rate limiting padrão para rotas REST de Revenue
revenueRouter.use(rateLimiters.rest);

/**
 * Helper para extrair IDs Multi-Tenant dos cabeçalhos com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/revenue/dashboard
 * Retorna o painel completo de inteligência comercial e revenue
 */
revenueRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await revenueService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao gerar o dashboard de Revenue Intelligence.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/revenue/metrics
 * Retorna indicadores e métricas consolidadas (ADR, RevPAR, Ocupação, Lead Time, Pickup, Pace)
 */
revenueRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const metrics = await revenueService.getMetrics(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: metrics
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter métricas comerciais e de revenue.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/revenue/forecast
 * Retorna a projeção / forecast de ocupação para N dias (padrão 30 dias)
 */
revenueRouter.get('/forecast', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const daysParam = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const days = isNaN(daysParam) || daysParam < 1 ? 30 : Math.min(daysParam, 90);

    const forecast = await revenueService.getForecast(organizationId, propertyId, days);
    return res.status(200).json({
      status: 'SUCCESS',
      days,
      data: forecast
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao calcular o forecast de ocupação.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/revenue/channels
 * Retorna a distribuição de receita e ADR por canal de venda
 */
revenueRouter.get('/channels', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const channels = await revenueService.getChannels(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: channels
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter receita por canais.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/revenue/categories
 * Retorna o desempenho comercial e RevPAR por categoria de acomodação
 */
revenueRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const categories = await revenueService.getCategories(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: categories
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter receita por categorias.',
      details: err?.message || String(err)
    });
  }
});
