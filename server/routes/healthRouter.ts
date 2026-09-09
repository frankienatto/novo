import { Router, Request, Response } from 'express';
import { env } from '../config/environment.ts';
import { aiOrchestrator } from '../modules/ai/aiOrchestrator.ts';
import { rateLimiters } from '../middlewares/rateLimitMiddleware.ts';

export const healthRouter = Router();

// Aplica rate limiting em endpoints de health check
healthRouter.use(rateLimiters.health);

/**
 * GET /health
 * Raiz de Health Check
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

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
  const isEnvReady = Boolean(env.JWT_SECRET);
  const isAiReady = Boolean(aiOrchestrator);
  const isN8nConfigured = Boolean(env.N8N_SECRET && env.N8N_SECRET.length >= 8);
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  const mercadoPagoConfigured = Boolean(env.MERCADOPAGO_ACCESS_TOKEN && env.MERCADOPAGO_WEBHOOK_SECRET && env.PAYMENTS_PUBLIC_BASE_URL);
  const picPayConfigured = Boolean(env.PICPAY_CLIENT_ID && env.PICPAY_CLIENT_SECRET && env.PICPAY_WEBHOOK_TOKEN);

  const checks = {
    environment: isEnvReady ? 'OK' : 'DEGRADED',
    aiOrchestrator: isAiReady ? 'OK' : 'UNAVAILABLE',
    n8nIntegration: isN8nConfigured ? 'OK' : 'UNCONFIGURED',
    payments: {
      stripe: stripeConfigured ? 'CONFIGURED' : 'UNCONFIGURED',
      mercadopago: mercadoPagoConfigured ? 'CONFIGURED' : 'UNCONFIGURED',
      picpay: picPayConfigured ? 'CONFIGURED' : 'UNCONFIGURED',
    },
  };

  // Optional integrations advertise their capability without making a healthy
  // core process unready. Their public endpoints fail closed when invoked.
  const isAllReady = isEnvReady;

  return res.status(isAllReady ? 200 : 503).json({
    status: isAllReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    checks,
  });
});
