import { Router, Request, Response } from 'express';
import { env } from '../config/environment.ts';
import { aiOrchestrator } from '../modules/ai/aiOrchestrator.ts';
import { rateLimiters } from '../middlewares/rateLimitMiddleware.ts';

export const healthRouter = Router();

// Aplica rate limiting em endpoints de health check
healthRouter.use(rateLimiters.health);

/**
 * GET /health/liveness
 * Probe de Liveness para Kubernetes / Cloud Run
 * Confirma se o processo do servidor está ativo e respondendo
 */
healthRouter.get('/liveness', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

/**
 * GET /health/readiness
 * Probe de Readiness para Kubernetes / Cloud Run
 * Verifica se os componentes internos e configurações cruciais estão prontos para receber tráfego
 */
healthRouter.get('/readiness', (_req: Request, res: Response) => {
  const isEnvReady = Boolean(env.GEMINI_API_KEY && env.JWT_SECRET && env.N8N_SECRET);
  const isAiReady = Boolean(aiOrchestrator);
  const isN8nConfigured = Boolean(env.N8N_SECRET && env.N8N_SECRET.length >= 8);

  const checks = {
    environment: isEnvReady ? 'OK' : 'DEGRADED',
    aiOrchestrator: isAiReady ? 'OK' : 'UNAVAILABLE',
    n8nIntegration: isN8nConfigured ? 'OK' : 'UNCONFIGURED',
  };

  const isAllReady = isEnvReady && isAiReady && isN8nConfigured;

  return res.status(isAllReady ? 200 : 503).json({
    status: isAllReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    checks,
  });
});
