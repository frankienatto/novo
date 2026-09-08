import { Router, Request, Response } from 'express';
import { planningService } from './planningService.ts';
import { requirePermission } from '../saas/middlewares/rbacMiddleware.ts';

export const planningRouter = Router();

/**
 * GET /api/planning/dashboard
 * Retorna o dashboard consolidado de planejamento e playbooks operacionais
 */
planningRouter.get('/dashboard', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const dashboard = await planningService.getDashboard(organizationId, propertyId);
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('❌ [PlanningRouter] Erro ao obter dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dashboard de planejamento operacional.' });
  }
});

/**
 * GET /api/planning/playbooks
 * Retorna a lista completa de playbooks operacionais em modo manual
 */
planningRouter.get('/playbooks', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const playbooks = await planningService.getPlaybooks(organizationId, propertyId);
    return res.status(200).json(playbooks);
  } catch (error: any) {
    console.error('❌ [PlanningRouter] Erro ao obter playbooks:', error);
    return res.status(500).json({ error: 'Erro interno ao obter playbooks operacionais.' });
  }
});

/**
 * GET /api/planning/summary
 * Retorna o resumo de planejamento para a IA (planningSummary)
 */
planningRouter.get('/summary', requirePermission('view_dashboard'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const summary = await planningService.getPlanningSummaryForAI(organizationId, propertyId);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('❌ [PlanningRouter] Erro ao obter resumo:', error);
    return res.status(500).json({ error: 'Erro interno ao obter resumo de planejamento.' });
  }
});

/**
 * POST /api/planning/generate
 * Gerar playbooks operacionais a partir das recomendações aprovadas.
 * Não realiza nenhuma ação operacional externa.
 */
planningRouter.post('/generate', requirePermission('manage_planning'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const playbooks = await planningService.generate(organizationId, propertyId);
    return res.status(200).json({
      message: 'Playbooks operacionais gerados com sucesso para execução manual.',
      executionNote: 'Nenhuma automação ou alteração em sistemas externos (PMS/OTAs/Canais) foi realizada. Todos os playbooks são para orientação do operador humano.',
      generatedCount: playbooks.length,
      playbooks
    });
  } catch (error: any) {
    console.error('❌ [PlanningRouter] Erro ao gerar playbooks:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar playbooks operacionais.' });
  }
});

/**
 * POST /api/planning/rebuild
 * Reconstruir sequências e dependências dos playbooks operacionais.
 * Não realiza nenhuma ação operacional externa.
 */
planningRouter.post('/rebuild', requirePermission('manage_planning'), async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const propertyId = req.propertyId!;

    const playbooks = await planningService.rebuild(organizationId, propertyId);
    return res.status(200).json({
      message: 'Sequências de playbooks reconstruídas com sucesso no Synapse Hospitality.',
      executionNote: 'Estrutura atualizada em memória sem chamadas externas.',
      playbooks
    });
  } catch (error: any) {
    console.error('❌ [PlanningRouter] Erro ao reconstruir playbooks:', error);
    return res.status(500).json({ error: 'Erro interno ao reconstruir playbooks.' });
  }
});
