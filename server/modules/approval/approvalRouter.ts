import { Router, Request, Response } from 'express';
import { approvalService } from './approvalService.ts';

export const approvalRouter = Router();

/**
 * GET /api/approval/dashboard
 * Retorna o dashboard consolidado de governança e métricas do Human Approval Workflow
 */
approvalRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const dashboard = await approvalService.getDashboard(organizationId, propertyId);
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao obter dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dashboard de aprovações.' });
  }
});

/**
 * GET /api/approval/pending
 * Retorna a lista de recomendações pendentes de aprovação humana
 */
approvalRouter.get('/pending', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const pending = await approvalService.getPending(organizationId, propertyId);
    return res.status(200).json(pending);
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao obter pendências:', error);
    return res.status(500).json({ error: 'Erro interno ao obter aprovações pendentes.' });
  }
});

/**
 * GET /api/approval/history
 * Retorna o histórico de decisões e auditoria de aprovações/rejeições
 */
approvalRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const history = await approvalService.getHistory(organizationId, propertyId);
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao obter histórico:', error);
    return res.status(500).json({ error: 'Erro interno ao obter histórico de aprovações.' });
  }
});

/**
 * GET /api/approval/summary
 * Retorna o resumo para IA (approvalSummary)
 */
approvalRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const summary = await approvalService.getApprovalSummaryForAI(organizationId, propertyId);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao obter resumo:', error);
    return res.status(500).json({ error: 'Erro interno ao obter resumo de aprovação.' });
  }
});

/**
 * POST /api/approval/approve
 * Registra a aprovação humana de uma recomendação.
 * Altera exclusivamente o estado interno de governança dentro do Synapse.
 * JAMAIS executa ações operacionais externas.
 */
approvalRouter.post('/approve', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.body.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.body.propertyId as string) || 'prop_dev_default';

    if (!req.body.recommendationId) {
      return res.status(400).json({ error: 'Parâmetro recommendationId é obrigatório.' });
    }

    const record = await approvalService.approve(req.body, organizationId, propertyId);
    return res.status(200).json({
      message: 'Aprovação humana registrada com sucesso no Synapse Hospitality.',
      executionNote: 'Nenhuma ação operacional externa foi executada. A implementação requer intervenção manual do operador.',
      approvalRecord: record
    });
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao aprovar recomendação:', error);
    return res.status(500).json({ error: 'Erro interno ao registrar aprovação.' });
  }
});

/**
 * POST /api/approval/reject
 * Registra a rejeição humana de uma recomendação.
 * Altera exclusivamente o estado interno de governança dentro do Synapse.
 * JAMAIS executa ações operacionais externas.
 */
approvalRouter.post('/reject', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.body.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.body.propertyId as string) || 'prop_dev_default';

    if (!req.body.recommendationId) {
      return res.status(400).json({ error: 'Parâmetro recommendationId é obrigatório.' });
    }

    const record = await approvalService.reject(req.body, organizationId, propertyId);
    return res.status(200).json({
      message: 'Rejeição humana registrada com sucesso no Synapse Hospitality.',
      executionNote: 'Estado atualizado para rejeitado. Nenhuma alteração realizada em sistemas externos.',
      approvalRecord: record
    });
  } catch (error: any) {
    console.error('❌ [ApprovalRouter] Erro ao rejeitar recomendação:', error);
    return res.status(500).json({ error: 'Erro interno ao registrar rejeição.' });
  }
});
