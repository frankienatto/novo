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
  const organizationId = req.organizationId;
  const propertyId = req.propertyId;
  if (!organizationId || !propertyId) {
    throw new Error('Contexto de Tenant não resolvido.');
  }
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

/**
 * GET /api/decision/distributed-context
 * Retorna os resumos consolidados de inteligência contextual para todos os módulos
 */
decisionRouter.get('/distributed-context', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const { contextDistributionService } = await import('../ai/context/contextDistributionService.ts');
    const data = contextDistributionService.getAllDistributedSummaries(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter inteligência contextual distribuída.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/decision/context/:module
 * Retorna insights contextuais e resumo direcionados a um módulo específico
 */
decisionRouter.get('/context/:module', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const moduleName = req.params.module as any;
    const minPriority = req.query.minPriority as any;
    const minConfidence = req.query.minConfidence ? Number(req.query.minConfidence) : undefined;
    const { contextDistributionService } = await import('../ai/context/contextDistributionService.ts');
    
    const summary = contextDistributionService.getModuleContextSummary(moduleName, organizationId, propertyId);
    const insights = contextDistributionService.getInsightsForModule({
      organizationId,
      propertyId,
      module: moduleName,
      minPriority,
      minConfidence
    });

    return res.status(200).json({
      status: 'SUCCESS',
      data: {
        summary,
        insights
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter insights contextuais para o módulo.',
      details: err?.message || String(err)
    });
  }
});
