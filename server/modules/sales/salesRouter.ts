import { Router, Request, Response } from 'express';
import { salesService } from './salesService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const salesRouter = Router();

// Aplica rate-limiting de REST
salesRouter.use(rateLimiters.rest);

/**
 * Extrai cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/sales/dashboard
 * Retorna o painel completo do Sales CRM com métricas, oportunidades quentes e follow-ups
 */
salesRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await salesService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard do Sales CRM.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/sales/metrics
 * Retorna indicadores e métricas do pipeline comercial
 */
salesRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const metrics = await salesService.getMetrics(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: metrics
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter métricas do Sales CRM.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/sales/opportunities
 * Lista oportunidades no pipeline comercial com filtros opcionais
 */
salesRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const stage = req.query.stage as any;
    const ownerName = req.query.ownerName as string | undefined;
    const temperature = req.query.temperature as string | undefined;

    const opportunities = await salesService.listOpportunities(organizationId, propertyId, {
      stage,
      ownerName,
      temperature
    });

    return res.status(200).json({
      status: 'SUCCESS',
      count: opportunities.length,
      data: opportunities
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao listar oportunidades comerciais.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/sales/opportunities/:id
 * Obtém detalhes de uma oportunidade comercial específica
 */
salesRouter.get('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const opp = await salesService.getOpportunityById(id, organizationId, propertyId);

    if (!opp) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Oportunidade comercial não encontrada.'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      data: opp
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter oportunidade comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/sales/opportunities
 * Cria uma nova oportunidade de venda no Sales CRM
 */
salesRouter.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const body = req.body || {};

    if (!body.leadName || !body.leadEmail || body.estimatedValue === undefined) {
      return res.status(400).json({
        status: 'ERROR',
        error: 'Campos obrigatórios ausentes: leadName, leadEmail, estimatedValue.'
      });
    }

    const opp = await salesService.createOpportunity(organizationId, propertyId, body);
    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Oportunidade comercial cadastrada com sucesso!',
      data: opp
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao cadastrar oportunidade comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * PUT /api/sales/opportunities/:id
 * Atualiza estágio, temperatura ou dados de uma oportunidade
 */
salesRouter.put('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body || {};

    const updated = await salesService.updateOpportunity(id, organizationId, propertyId, body);
    if (!updated) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Oportunidade comercial não encontrada para atualização.'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Oportunidade comercial atualizada com sucesso.',
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao atualizar oportunidade comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/sales/opportunities/:id/interactions
 * Registra uma nova interação comercial (Ligação, WhatsApp, Email, Nota)
 */
salesRouter.post('/opportunities/:id/interactions', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body || {};

    if (!body.type || !body.summary || !body.authorName) {
      return res.status(400).json({
        status: 'ERROR',
        error: 'Campos obrigatórios ausentes: type, summary, authorName.'
      });
    }

    const updated = await salesService.addInteraction(id, organizationId, propertyId, body);
    if (!updated) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Oportunidade comercial não encontrada para registrar interação.'
      });
    }

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Interação comercial registrada com sucesso.',
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao registrar interação comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/sales/opportunities/:id/follow-up
 * Agenda um novo follow-up para a oportunidade
 */
salesRouter.post('/opportunities/:id/follow-up', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const body = req.body || {};

    if (!body.dueDate || !body.actionDescription) {
      return res.status(400).json({
        status: 'ERROR',
        error: 'Campos obrigatórios ausentes: dueDate, actionDescription.'
      });
    }

    const updated = await salesService.scheduleFollowUp(id, organizationId, propertyId, body);
    if (!updated) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Oportunidade comercial não encontrada para agendar follow-up.'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Follow-up comercial agendado com sucesso.',
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao agendar follow-up comercial.',
      details: err?.message || String(err)
    });
  }
});
