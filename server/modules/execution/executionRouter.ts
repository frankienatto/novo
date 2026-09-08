import { Router, Request, Response } from 'express';
import { executionService } from './executionService.ts';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';

export const executionRouter = Router();

/**
 * GET /api/execution/dashboard
 * Retorna o dashboard consolidado de acompanhamento da execução operacional
 */
executionRouter.get('/dashboard', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const dashboard = await executionService.getDashboard(organizationId, propertyId);
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao obter dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dashboard de execução operacional.' });
  }
});

/**
 * GET /api/execution/list
 * Retorna a lista completa de acompanhamento de execuções
 */
executionRouter.get('/list', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const list = await executionService.getExecutions(organizationId, propertyId);
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao obter lista de execuções:', error);
    return res.status(500).json({ error: 'Erro interno ao listar execuções operacionais.' });
  }
});

/**
 * GET /api/execution/summary
 * Retorna o resumo para o ContextService da IA (executionSummary)
 */
executionRouter.get('/summary', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const summary = await executionService.getExecutionSummaryForAI(organizationId, propertyId);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao obter resumo:', error);
    return res.status(500).json({ error: 'Erro interno ao obter resumo de execução.' });
  }
});

/**
 * POST /api/execution/start
 * Marca o início da execução manual de um playbook.
 * Não realiza nenhuma chamada ou alteração externa.
 */
executionRouter.post('/start', requirePermission('manage_execution'), async (req: Request, res: Response) => {
  try {
    const { executionId, notes } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const owner = req.saasUser!.name || req.saasUser!.email || req.saasUser!.userId;
    const record = await executionService.startExecution(executionId, req.organizationId!, req.propertyId!, owner, notes);
    return res.status(200).json({
      message: 'Acompanhamento de execução iniciado com sucesso.',
      executionNote: 'Nenhuma ação externa foi disparada. O estado foi atualizado para acompanhamento humano.',
      record
    });
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao iniciar execução:', error);
    return res.status(500).json({ error: 'Erro interno ao iniciar execução operacional.' });
  }
});

/**
 * POST /api/execution/update
 * Atualiza o progresso e o checklist manual de uma execução.
 * Não realiza nenhuma chamada ou alteração externa.
 */
executionRouter.post('/update', requirePermission('manage_execution'), async (req: Request, res: Response) => {
  try {
    const { executionId, progressPercent, completedStepIds, notes, blocked, blockReason } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const record = await executionService.updateProgress(
      executionId, req.organizationId!, req.propertyId!,
      typeof progressPercent === 'number' ? progressPercent : 50,
      completedStepIds,
      notes,
      blocked,
      blockReason
    );

    return res.status(200).json({
      message: 'Progresso da execução manual atualizado com sucesso.',
      executionNote: 'Alteração mantida no estado interno de acompanhamento do Synapse Hospitality.',
      record
    });
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao atualizar progresso:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar progresso da execução.' });
  }
});

/**
 * POST /api/execution/complete
 * Conclui o acompanhamento de uma execução manual.
 * Não realiza nenhuma chamada ou alteração externa.
 */
executionRouter.post('/complete', requirePermission('manage_execution'), async (req: Request, res: Response) => {
  try {
    const { executionId, notes } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const owner = req.saasUser!.name || req.saasUser!.email || req.saasUser!.userId;
    const record = await executionService.completeExecution(executionId, req.organizationId!, req.propertyId!, owner, notes);
    return res.status(200).json({
      message: 'Execução manual concluída e registrada no histórico de produtividade.',
      executionNote: 'Nenhuma modificação foi realizada no PMS/OTAs ou sistemas externos.',
      record
    });
  } catch (error: any) {
    console.error('❌ [ExecutionRouter] Erro ao concluir execução:', error);
    return res.status(500).json({ error: 'Erro interno ao concluir execução operacional.' });
  }
});
