import { Router, Request, Response } from 'express';
import { directBookingService } from './directBookingService.ts';
import { rateLimiters } from '../../middlewares/rateLimitMiddleware.ts';

export const directBookingRouter = Router();

// Aplica rate-limiting de REST
directBookingRouter.use(rateLimiters.rest);

/**
 * Helper para extrair cabeçalhos Multi-Tenant com fallback seguro
 */
function getTenantHeaders(req: Request) {
  const organizationId = (req.headers['x-organization-id'] as string) || 'org_dev_default';
  const propertyId = (req.headers['x-property-id'] as string) || 'prop_dev_default';
  return { organizationId, propertyId };
}

/**
 * GET /api/direct-booking/dashboard
 * Retorna o painel comercial completo com KPIs, propostas recentes e em expiração
 */
directBookingRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const dashboard = await directBookingService.getDashboard(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: dashboard
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao carregar dashboard de reservas diretas e CRM comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/direct-booking/metrics
 * Retorna indicadores e métricas consolidadas do funil comercial de vendas
 */
directBookingRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const metrics = await directBookingService.getMetrics(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: metrics
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter métricas do funil comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/direct-booking/proposals
 * Lista propostas comerciais ativas/históricas com filtro opcional por status
 */
directBookingRouter.get('/proposals', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const status = req.query.status as string | undefined;
    const proposals = await directBookingService.listProposals(organizationId, propertyId, status);
    return res.status(200).json({
      status: 'SUCCESS',
      count: proposals.length,
      data: proposals
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao listar propostas comerciais.',
      details: err?.message || String(err)
    });
  }
});

/**
 * GET /api/direct-booking/proposals/:proposalId
 * Obtém detalhes de uma proposta comercial específica
 */
directBookingRouter.get('/proposals/:proposalId', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const proposalId = Array.isArray(req.params.proposalId) ? req.params.proposalId[0] : req.params.proposalId;
    const proposal = await directBookingService.getProposalById(proposalId, organizationId, propertyId);
    if (!proposal) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Proposta comercial não encontrada.'
      });
    }
    return res.status(200).json({
      status: 'SUCCESS',
      data: proposal
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao obter proposta comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * POST /api/direct-booking/proposals
 * Cria uma nova proposta comercial (Inquiry/Cotação Direct Booking)
 */
directBookingRouter.post('/proposals', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const body = req.body || {};

    if (!body.leadName || !body.leadEmail || !body.categoryName || !body.checkInDate || !body.checkOutDate || body.offeredRateDaily === undefined) {
      return res.status(400).json({
        status: 'ERROR',
        error: 'Campos obrigatórios ausentes: leadName, leadEmail, categoryName, checkInDate, checkOutDate, offeredRateDaily.'
      });
    }

    const proposal = await directBookingService.createProposal(organizationId, propertyId, body);
    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Proposta comercial gerada com sucesso!',
      data: proposal
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao gerar proposta comercial.',
      details: err?.message || String(err)
    });
  }
});

/**
 * PUT /api/direct-booking/proposals/:proposalId
 * Atualiza status ou negociação de uma proposta comercial
 */
directBookingRouter.put('/proposals/:proposalId', async (req: Request, res: Response) => {
  try {
    const { organizationId, propertyId } = getTenantHeaders(req);
    const proposalId = Array.isArray(req.params.proposalId) ? req.params.proposalId[0] : req.params.proposalId;
    const body = req.body || {};

    const updated = await directBookingService.updateProposal(proposalId, organizationId, propertyId, body);
    if (!updated) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'Proposta comercial não encontrada para atualização.'
      });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Proposta comercial atualizada com sucesso.',
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'Falha ao atualizar proposta comercial.',
      details: err?.message || String(err)
    });
  }
});
