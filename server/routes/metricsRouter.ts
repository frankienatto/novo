import { Router, Request, Response } from 'express';
import { metricsCollector } from '../utils/metricsCollector.ts';
import { cacheConfig } from '../config/cacheConfig.ts';
import { rateLimiters } from '../middlewares/rateLimitMiddleware.ts';

export const metricsRouter = Router();

// Aplica rate limiting em endpoints de métricas
metricsRouter.use(rateLimiters.health);

/**
 * GET /metrics
 * Endpoint REST para expor métricas de desempenho e runtime do servidor
 */
metricsRouter.get('/', async (_req: Request, res: Response) => {
  if (!cacheConfig.METRICS_ENABLED) {
    return res.status(403).json({
      status: 'DISABLED',
      message: 'A coleta de métricas de runtime está desativada no momento.',
    });
  }

  const metrics = await metricsCollector.getMetricsSummary();
  return res.status(200).json(metrics);
});
