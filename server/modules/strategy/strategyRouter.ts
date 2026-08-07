import { Router, Request, Response } from 'express';
import { strategyService } from './strategyService.ts';
import { strategicPlanningEngine } from '../ai/planning/strategicPlanningEngine.ts';
import { approvalRepository } from '../approval/approvalRepository.ts';

export const strategyRouter = Router();

/**
 * GET /api/strategy/dashboard
 * Retorna o dashboard completo do módulo Strategic Simulation & Explainable AI
 */
strategyRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const dashboard = await strategyService.getDashboard(organizationId, propertyId);
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao obter dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dashboard de estratégia e simulação.' });
  }
});

/**
 * GET /api/strategy/plan/active
 * Retorna o plano estratégico ativo atual para a propriedade
 */
strategyRouter.get('/plan/active', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const activePlan = strategicPlanningEngine.getActivePlan(organizationId, propertyId);
    return res.status(200).json({
      status: 'SUCCESS',
      data: activePlan || null
    });
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao obter plano ativo:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar plano estratégico ativo.' });
  }
});

/**
 * POST /api/strategy/plan/generate
 * Executa o ciclo completo do Cérebro Executivo (Strategic Analysis -> Simulation -> Decision Proposals -> ADR-005 Approval Center)
 */
strategyRouter.post('/plan/generate', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.body?.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.body?.propertyId as string) || 'prop_dev_default';
    const actor = req.body?.actor || 'ExecutiveUI';

    const plan = await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId,
      propertyId,
      actor
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Ciclo estratégico executado e recomendações enviadas para o Approval Center (ADR-005).',
      data: plan
    });
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao gerar plano estratégico:', error);
    return res.status(500).json({ error: 'Erro interno ao executar ciclo de planejamento estratégico.' });
  }
});

/**
 * POST /api/strategy/plan/approve
 * Transiciona aprovação de uma recomendação via ADR-005 e dispara desdobramento no GoalEngine
 */
strategyRouter.post('/plan/approve', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.body?.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.body?.propertyId as string) || 'prop_dev_default';
    const { recommendationId, decisionBy, reason } = req.body || {};

    if (!recommendationId) {
      return res.status(400).json({ error: 'recommendationId é obrigatório.' });
    }

    const record = await approvalRepository.approveRecommendation({
      recommendationId,
      decisionBy: decisionBy || 'HumanOperator',
      reason: reason || 'Aprovado via Strategy UI (ADR-005)'
    }, organizationId, propertyId);

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Recomendação aprovada com sucesso. Evento publicado para o GoalEngine.',
      data: record
    });
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao aprovar recomendação:', error);
    return res.status(500).json({ error: 'Erro interno ao aprovar recomendação estratégica.' });
  }
});

/**
 * GET /api/strategy/scenarios
 * Retorna os cenários de simulação "What If"
 */
strategyRouter.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const scenarios = await strategyService.getScenarios(organizationId, propertyId);
    return res.status(200).json(scenarios);
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao obter cenários:', error);
    return res.status(500).json({ error: 'Erro interno ao obter cenários de simulação.' });
  }
});

/**
 * POST /api/strategy/simulate
 * Recebe parâmetros de simulação e retorna projeção em memória sem alterar nenhum dado
 */
strategyRouter.post('/simulate', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.body.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.body.propertyId as string) || 'prop_dev_default';

    const result = await strategyService.simulate(req.body, organizationId, propertyId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao executar simulação:', error);
    return res.status(500).json({ error: 'Erro interno ao executar simulação em memória.' });
  }
});

/**
 * GET /api/strategy/summary
 * Retorna o resumo para IA (strategySummary)
 */
strategyRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string) || 'org_dev_default';
    const propertyId = (req.headers['x-property-id'] as string) || (req.query.propertyId as string) || 'prop_dev_default';

    const summary = await strategyService.getStrategySummaryForAI(organizationId, propertyId);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('❌ [StrategyRouter] Erro ao obter resumo:', error);
    return res.status(500).json({ error: 'Erro interno ao obter resumo estratégico.' });
  }
});

