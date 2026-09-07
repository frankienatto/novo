import { Router, Request, Response, NextFunction } from 'express';
import { n8nService } from './n8nService.ts';
import { N8nWebhookPayload } from './integrationTypes.ts';
import { parsePaginationParams, paginateArray } from '../../utils/pagination.ts';
import { cacheConfig } from '../../config/cacheConfig.ts';
import { env } from '../../config/environment.ts';

export const n8nRouter = Router();

// Middleware de Autenticação para Ingestão do n8n
export const authenticateN8n = (req: Request, res: Response, next: NextFunction) => {
  const apiKeyHeader = req.headers['x-n8n-api-key'] || req.headers['authorization'];
  const expectedApiKey = env.N8N_SECRET;

  if (!expectedApiKey) {
    return res.status(503).json({ error: 'Barramento n8n n\u00e3o configurado.' });
  }

  if (apiKeyHeader === expectedApiKey || apiKeyHeader === `Bearer ${expectedApiKey}`) {
    return next();
  }

  return res.status(401).json({
    error: 'Acesso não autorizado ao barramento n8n.',
    message: 'Header [x-n8n-api-key] inválido ou ausente.'
  });
};

// Middleware de Contexto Multi-tenant
export const extractTenantContext = (req: Request, res: Response, next: NextFunction) => {
  const orgId = env.N8N_ORGANIZATION_ID;
  const propId = env.N8N_PROPERTY_ID;

  if (!orgId || !propId) {
    return res.status(503).json({ error: 'Contexto de tenant do n8n n\u00e3o configurado.' });
  }

  const requestedOrgId = (req.headers['x-organization-id'] as string) || req.body?.organizationId;
  const requestedPropId = (req.headers['x-property-id'] as string) || req.body?.propertyId;
  if ((requestedOrgId && requestedOrgId !== orgId) || (requestedPropId && requestedPropId !== propId)) {
    return res.status(403).json({ error: 'Contexto de tenant n\u00e3o autorizado.' });
  }

  (req as any).organizationId = orgId;
  (req as any).propertyId = propId;
  next();
};

n8nRouter.use(authenticateN8n);
n8nRouter.use(extractTenantContext);

/**
 * GET /api/integration/n8n/health
 * Health check do barramento de integração n8n
 */
n8nRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'Synapse n8n Integration Gateway',
    timestamp: new Date().toISOString(),
    organizationId: (req as any).organizationId,
    propertyId: (req as any).propertyId
  });
});

/**
 * POST /api/integration/n8n/webhook
 * Ponto de ingestão de eventos normalizados do n8n (Aloha PMS, iCal, Google Calendar)
 */
n8nRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;

    const payload: N8nWebhookPayload = {
      eventId: req.body.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: req.body.eventType,
      timestamp: req.body.timestamp || new Date().toISOString(),
      organizationId: orgId,
      propertyId: propId,
      sourceSystem: req.body.sourceSystem || 'n8n',
      payload: req.body.payload || req.body
    };

    if (!payload.eventType) {
      return res.status(400).json({
        error: 'Requisição inválida.',
        message: 'O campo [eventType] é obrigatório no payload do webhook.'
      });
    }

    const result = await n8nService.processEvent(payload);

    if (!result.success) {
      return res.status(422).json({
        error: 'Falha no processamento do evento n8n.',
        result
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      result
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro interno ao processar webhook n8n.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/integration/n8n/logs
 * Retorna os logs de auditoria de sincronização n8n para o tenant
 */
n8nRouter.get('/logs', (req: Request, res: Response) => {
  const orgId = (req as any).organizationId;
  const propId = (req as any).propertyId;

  const logs = n8nService.getSyncLogs(orgId, propId);
  const paginationParams = parsePaginationParams(req.query, cacheConfig.MAX_LOG_PAGE_SIZE, 20);
  const paginated = paginateArray(logs, paginationParams, (l) => l.createdAt);

  return res.json({
    organizationId: orgId,
    propertyId: propId,
    totalLogs: logs.length,
    data: paginated.data,
    pagination: paginated.pagination
  });
});
