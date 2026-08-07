import { Router, Request, Response } from 'express';
import { crmService } from './crmService.ts';
import { timelineService } from './timelineService.ts';
import { guestIntelligenceService } from './guestIntelligenceService.ts';
import { validateRequest } from '../../middlewares/validationMiddleware.ts';
import { crmSchemas } from '../../schemas/routeSchemas.ts';

import { CreateGuestDTO, UpdateGuestDTO, GuestQueryFilters } from './guestTypes.ts';
import { AppendTimelineEventDTO } from './timelineTypes.ts';
import { parsePaginationParams, paginateArray } from '../../utils/pagination.ts';
import { cacheConfig } from '../../config/cacheConfig.ts';

export const crmRouter = Router();

// Middleware de Extração de Tenant Context (com suporte a Organization ID)
const extractTenantContext = (req: Request, res: Response, next: any) => {
  const orgId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
  const propId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

  (req as any).organizationId = orgId;
  (req as any).propertyId = propId;
  next();
};

crmRouter.use(extractTenantContext);

/**
 * POST /api/crm/guests
 * Criar ou atualizar perfil de hóspede na Organização
 */
crmRouter.post('/guests', validateRequest({ body: crmSchemas.createGuest }), async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const dto: CreateGuestDTO = req.body;

    if (!dto.fullName || !dto.email || !dto.phone) {
      return res.status(400).json({
        error: 'Requisição inválida.',
        message: 'Os campos [fullName], [email] e [phone] são obrigatórios para o cadastro de hóspede.'
      });
    }

    const guest = await crmService.createGuest(orgId, dto);

    return res.status(201).json({
      status: 'SUCCESS',
      data: guest
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao cadastrar hóspede no CRM.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests
 * Listar hóspedes da Organização com busca e filtros
 */
crmRouter.get('/guests', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;

    const filters: GuestQueryFilters = {
      search: req.query.search ? String(req.query.search) : undefined,
      classification: req.query.classification as any,
      tag: req.query.tag ? String(req.query.tag) : undefined,
      minStays: req.query.minStays ? Number(req.query.minStays) : undefined,
      propertyId: req.query.propertyId ? String(req.query.propertyId) : undefined
    };

    const guests = await crmService.listGuests(orgId, filters);
    const paginationParams = parsePaginationParams(req.query, cacheConfig.MAX_LOG_PAGE_SIZE, 20);
    const paginated = paginateArray(guests, paginationParams, (g) => g.fullName);

    return res.status(200).json({
      status: 'SUCCESS',
      totalCount: guests.length,
      data: paginated.data,
      pagination: paginated.pagination
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao listar hóspedes no CRM.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests/:guestId
 * Buscar detalhes de um perfil de hóspede por ID
 */
crmRouter.get('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const guest = await crmService.getGuestById(guestId);

    if (!guest) {
      return res.status(404).json({
        error: 'Hóspede não encontrado.',
        message: `Nenhum perfil de hóspede encontrado com o ID [${guestId}].`
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      data: guest
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter perfil de hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests/:guestId/360
 * Obter o Perfil 360° completo do hóspede (dados cadastrais + timeline inteira)
 */
crmRouter.get('/guests/:guestId/360', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const profile360 = await timelineService.getGuest360Profile(guestId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: profile360
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao carregar Perfil 360° do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests/:guestId/intelligence
 * Obter a Inteligência do Hóspede calculada automaticamente (Read-Only)
 */
crmRouter.get('/guests/:guestId/intelligence', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const intelligence = await guestIntelligenceService.calculateGuestIntelligence(guestId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: intelligence
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao calcular inteligência do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests/:guestId/summary
 * Obter o Resumo Inteligente enxuto do Hóspede (Read-Only)
 */
crmRouter.get('/guests/:guestId/summary', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const summary = await guestIntelligenceService.getGuestSummary(guestId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: summary
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter resumo inteligente do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * PUT /api/crm/guests/:guestId
 * Atualizar dados cadastrais ou preferências de um hóspede
 */
crmRouter.put('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const dto: UpdateGuestDTO = req.body;

    const updated = await crmService.updateGuest(guestId, dto);

    return res.status(200).json({
      status: 'SUCCESS',
      data: updated
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao atualizar perfil do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * POST /api/crm/guests/:guestId/stays
 * Registrar um histórico de estadia para o hóspede
 */
crmRouter.post('/guests/:guestId/stays', async (req: Request, res: Response) => {
  try {
    const propId = (req as any).propertyId;
    const guestId = String(req.params.guestId);
    const { reservationId, checkInDate, checkOutDate, unitNumber, roomCategoryName, totalSpentAmount, bookingChannel, guestRating, notes } = req.body;

    if (!reservationId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        error: 'Requisição inválida.',
        message: 'Os campos [reservationId], [checkInDate] e [checkOutDate] são obrigatórios.'
      });
    }

    const updatedGuest = await crmService.recordStay(guestId, {
      propertyId: req.body.propertyId || propId,
      reservationId,
      checkInDate,
      checkOutDate,
      unitNumber,
      roomCategoryName,
      totalSpentAmount: Number(totalSpentAmount || 0),
      bookingChannel: bookingChannel || 'direct',
      guestRating: guestRating ? Number(guestRating) : undefined,
      notes
    });

    return res.status(200).json({
      status: 'SUCCESS',
      data: updatedGuest
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao registrar histórico de estadia do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * POST /api/crm/guests/:guestId/timeline
 * Publicar um novo evento na Timeline do hóspede (Event-Driven Endpoint)
 */
crmRouter.post('/guests/:guestId/timeline', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const propId = (req as any).propertyId;
    const guestId = String(req.params.guestId);

    const { source, eventType, title, description, reservationId, unitId, unitNumber, metadata } = req.body;

    if (!source || !eventType || !title) {
      return res.status(400).json({
        error: 'Payload inválido.',
        message: 'Os campos [source], [eventType] e [title] são obrigatórios para registrar eventos na timeline.'
      });
    }

    const dto: AppendTimelineEventDTO = {
      organizationId: req.body.organizationId || orgId,
      propertyId: req.body.propertyId || propId,
      source,
      eventType,
      title,
      description,
      reservationId,
      unitId,
      unitNumber,
      metadata
    };

    const event = await timelineService.appendTimelineEvent(guestId, dto);

    return res.status(201).json({
      status: 'SUCCESS',
      data: event
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao publicar evento na Timeline do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/guests/:guestId/timeline
 * Listar os eventos da Timeline de um hóspede
 */
crmRouter.get('/guests/:guestId/timeline', async (req: Request, res: Response) => {
  try {
    const guestId = String(req.params.guestId);
    const paginationParams = parsePaginationParams(req.query, cacheConfig.MAX_TIMELINE_PAGE_SIZE, 10);

    const timeline = await timelineService.getTimeline(guestId);
    const paginated = paginateArray(timeline, paginationParams, (e) => e.createdAt);

    return res.status(200).json({
      status: 'SUCCESS',
      totalEvents: timeline.length,
      data: paginated.data,
      pagination: paginated.pagination
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao consultar Timeline do hóspede.',
      message: err?.message || err
    });
  }
});

/**
 * GET /api/crm/metrics
 * Métricas gerais consolidadas do CRM em nível de Organização
 */
crmRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const metrics = await crmService.getMetrics(orgId);

    return res.status(200).json({
      status: 'SUCCESS',
      data: metrics
    });

  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro ao obter métricas do CRM.',
      message: err?.message || err
    });
  }
});

