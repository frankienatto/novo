import { Router, Request, Response } from 'express';
import { googleCalendarService } from './googleCalendarService.ts';
import { GCalSyncRequest, GCalEventType } from './googleCalendarTypes.ts';
import { requirePermission } from '../../saas/middlewares/rbacMiddleware.ts';

export const googleCalendarRouter = Router();

// O contexto é preenchido exclusivamente pelo authMiddleware + tenantMiddleware
// montados em server.ts. Nunca aceite tenant dos headers, query ou body aqui.
const extractTenantContext = (req: Request, res: Response, next: any) => {
  if (!req.organizationId || !req.propertyId) {
    return res.status(403).json({ error: 'Contexto de tenant não resolvido.' });
  }
  next();
};

googleCalendarRouter.use(extractTenantContext);

/**
 * POST /api/integration/google-calendar/sync
 * Endpoint para receber eventos operacionais sincronizados pelo n8n
 */
googleCalendarRouter.post('/sync', requirePermission('manage_integrations'), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;

    const { eventId, eventType, payload, sourceSystem } = req.body;

    if (!eventId || !eventType || !payload) {
      return res.status(400).json({
        error: 'Payload de requisição inválido.',
        message: 'Os campos [eventId], [eventType] e [payload] são obrigatórios.'
      });
    }

    const validEventTypes: GCalEventType[] = [
      'reservation.created',
      'reservation.updated',
      'reservation.cancelled',
      'room.blocked',
      'room.maintenance',
      'housekeeping.task',
      'custom.calendar.event'
    ];

    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        error: 'Tipo de evento inválido.',
        message: `O campo [eventType] deve ser um dos seguintes: ${validEventTypes.join(', ')}.`
      });
    }

    const syncRequest: GCalSyncRequest = {
      eventId,
      eventType,
      organizationId: orgId,
      propertyId: propId,
      sourceSystem: sourceSystem || 'n8n_gcal',
      payload: {
        eventId: payload.eventId || eventId,
        gcalEventId: payload.gcalEventId,
        eventType,
        eventVersion: payload.eventVersion || 1,
        calendarId: payload.calendarId,
        title: payload.title || 'Evento de Calendário',
        description: payload.description,
        startTime: payload.startTime || new Date().toISOString(),
        endTime: payload.endTime || new Date().toISOString(),
        unitId: payload.unitId,
        unitNumber: payload.unitNumber,
        status: payload.status || 'active',
        metadata: payload.metadata
      }
    };

    const result = await googleCalendarService.syncEvent(syncRequest);

    return res.status(result.success ? 200 : 400).json(result);

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro interno ao processar sincronização com Google Calendar via n8n.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/integration/google-calendar/status
 * Retorna as métricas e estado da sincronização do Google Calendar por tenant
 */
googleCalendarRouter.get('/status', requirePermission('view_dashboard'), (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;

    const status = googleCalendarService.getStatus(orgId, propId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: status
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter status da sincronização.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/integration/google-calendar/logs
 * Retorna o histórico de auditoria dos eventos sincronizados via n8n
 */
googleCalendarRouter.get('/logs', requirePermission('view_dashboard'), (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;

    const logs = googleCalendarService.getLogs(orgId, propId);

    return res.status(200).json({
      status: 'SUCCESS',
      totalLogs: logs.length,
      data: logs
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao consultar logs de auditoria do Google Calendar.',
      message: err?.message || err
    });
  }
});
