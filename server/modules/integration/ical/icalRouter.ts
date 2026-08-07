import { Router, Request, Response } from 'express';
import { icalService } from './icalService.ts';

export const icalRouter = Router();

// Middleware de Contexto Multi-tenant
const extractTenantContext = (req: Request, res: Response, next: any) => {
  const orgId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
  const propId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

  (req as any).organizationId = orgId;
  (req as any).propertyId = propId;
  next();
};

icalRouter.use(extractTenantContext);

/**
 * GET /api/integration/ical/export/property/:propertyId
 * Retorna o arquivo .ics com o feed completo de reservas da propriedade
 */
icalRouter.get('/export/property/:propertyId', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propertyId = String(req.params.propertyId);

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
icalRouter.get('/export/unit/:unitId', async (req: Request, res: Response) => {
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
icalRouter.post('/import', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;
    const { icsContent, targetUnitId } = req.body;

    if (!icsContent || typeof icsContent !== 'string') {
      return res.status(400).json({
        error: 'Requisição inválida.',
        message: 'O campo [icsContent] contendo a string iCalendar (RFC 5545) é obrigatório.'
      });
    }

    const result = await icalService.importFeedContent(orgId, propId, icsContent, targetUnitId);

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
