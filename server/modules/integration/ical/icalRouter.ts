import { Router, Request, Response } from 'express';
import { icalService } from './icalService.ts';
import { requirePermission } from '../../saas/middlewares/rbacMiddleware.ts';
import { icalRepository } from './icalRepository.ts';
import { randomUUID } from 'node:crypto';
import { validateIcalRemoteUrl } from './icalUrlSafety.ts';

export const icalRouter = Router();

// O contexto é preenchido exclusivamente pelo authMiddleware + tenantMiddleware
// montados em server.ts. Nunca aceite tenant dos headers, query ou body aqui.
const extractTenantContext = (req: Request, res: Response, next: any) => {
  if (!req.organizationId || !req.propertyId) {
    return res.status(403).json({ error: 'Contexto de tenant não resolvido.' });
  }
  next();
};

icalRouter.use(extractTenantContext);

icalRouter.post('/feeds', requirePermission('manage_integrations'), async (req: Request, res: Response) => {
  const { unitId, provider, feedUrl } = req.body || {};
  if (!unitId || !provider || !feedUrl) return res.status(400).json({ error: 'unitId, provider e feedUrl são obrigatórios.' });
  try {
    await validateIcalRemoteUrl(String(feedUrl));
  } catch { return res.status(400).json({ error: 'URL iCal inválida.' }); }
  const now = new Date().toISOString();
  const feed = { feedId: randomUUID(), organizationId: req.organizationId!, propertyId: req.propertyId!, unitId, provider: String(provider), feedUrl: String(feedUrl), active: true, createdAt: now, updatedAt: now };
  await icalRepository.saveFeed(feed);
  return res.status(201).json({ data: { ...feed, feedUrl: undefined } });
});

icalRouter.post('/feeds/:feedId/sync', requirePermission('manage_integrations'), async (req: Request, res: Response) => {
  try { return res.status(200).json({ status: 'SUCCESS', ...(await icalService.syncFeed(req.organizationId!, req.propertyId!, String(req.params.feedId))) }); }
  catch { return res.status(400).json({ error: 'Falha segura ao sincronizar feed iCal.' }); }
});

/**
 * GET /api/integration/ical/export/property/:propertyId
 * Retorna o arquivo .ics com o feed completo de reservas da propriedade
 */
icalRouter.get('/export/property/:propertyId', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propertyId = String(req.params.propertyId);
    if (propertyId !== req.propertyId) {
      return res.status(403).json({ error: 'Acesso negado à propriedade solicitada.' });
    }

    const { filename, icsContent } = await icalService.generatePropertyFeed(orgId, propertyId);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(icsContent);

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao gerar feed iCal da propriedade.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/integration/ical/export/unit/:unitId
 * Retorna o arquivo .ics com o feed de reservas de uma UH específica
 */
icalRouter.get('/export/unit/:unitId', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;
    const unitId = String(req.params.unitId);

    const { filename, icsContent } = await icalService.generatePropertyFeed(orgId, propId, unitId);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(icsContent);

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao gerar feed iCal da Unidade Hoteleira.',
      message: err?.message || err
    });
  }
});

/**
 * POST /api/integration/ical/import
 * Ingestão e parsing de um conteúdo .ics (RFC 5545)
 */
icalRouter.post('/import', requirePermission('manage_integrations'), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;
    const { icsContent, targetUnitId, feedId } = req.body;

    if (!icsContent || typeof icsContent !== 'string') {
      return res.status(400).json({
        error: 'Requisição inválida.',
        message: 'O campo [icsContent] contendo a string iCalendar (RFC 5545) é obrigatório.'
      });
    }

    const result = await icalService.importFeedContent(orgId, propId, icsContent, targetUnitId, feedId);

    return res.status(200).json({
      status: 'SUCCESS',
      ...result
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro interno ao importar feed iCal.',
      message: err?.message || err
    });
  }
});
