import { Router, Request, Response } from 'express';
import { executionService } from './executionService.ts';

export const executionRouter = Router();

/**
 * GET /api/execution/dashboard
 * Retorna o dashboard consolidado de acompanhamento da execução operacional
 */
executionRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

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
executionRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

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
executionRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

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
executionRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const { executionId, owner, notes } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const record = await executionService.startExecution(executionId, owner, notes);
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
executionRouter.post('/update', async (req: Request, res: Response) => {
  try {
    const { executionId, progressPercent, completedStepIds, notes, blocked, blockReason } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const record = await executionService.updateProgress(
      executionId,
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
executionRouter.post('/complete', async (req: Request, res: Response) => {
  try {
    const { executionId, owner, notes } = req.body;
    if (!executionId) {
      return res.status(400).json({ error: 'Parâmetro executionId é obrigatório.' });
    }

    const record = await executionService.completeExecution(executionId, owner, notes);
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
