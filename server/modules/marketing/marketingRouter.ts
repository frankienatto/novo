import { Router, Request, Response } from 'express';
import { marketingService } from './marketingService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const marketingRouter = Router();

// Aplica rate-limiting de REST
marketingRouter.use(rateLimiters.rest);

/**
 * Extrai cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/marketing/dashboard
 * Retorna o painel completo de Marketing Intelligence
 */
marketingRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await marketingService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard de Marketing Intelligence.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/marketing/segments
 * Retorna métricas dos segmentos de mercado e perfil de clientes
 */
marketingRouter.get('/segments', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const segments = await marketingService.getSegments(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: segments.length,
      data: segments
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter segmentos de marketing.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/marketing/journey
 * Retorna métricas da jornada do cliente (Customer Journey)
 */
marketingRouter.get('/journey', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const journey = await marketingService.getCustomerJourney(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: journey
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter métricas da jornada do cliente.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/marketing/markets
 * Retorna estatísticas geográficas e perfil de mercados
 */
marketingRouter.get('/markets', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const markets = await marketingService.getMarkets(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: markets.length,
      data: markets
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter dados de mercados geográficos.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/marketing/channels
 * Retorna desempenho de canais de captação de marketing
 */
marketingRouter.get('/channels', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const channels = await marketingService.getChannels(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      count: channels.length,
      data: channels
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter desempenho de canais de marketing.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/marketing/retention
 * Retorna análises de retenção, recorrência e LTV dos hóspedes
 */
marketingRouter.get('/retention', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const retention = await marketingService.getRetentionAnalysis(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: retention
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter análises de retenção e recorrência.',
      details: err?.message || String(err)
    });
  }
});
