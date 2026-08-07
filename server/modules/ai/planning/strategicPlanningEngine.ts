import { strategicAnalyzer } from './strategicAnalyzer.ts';
import { strategicPlanner } from './strategicPlanner.ts';
import { strategicScheduler, PlanningTrigger } from './strategicScheduler.ts';
import { StrategicPlan, ExplainableRecommendation } from './planningTypes.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { approvalRepository } from '../../approval/approvalRepository.ts';
import { goalEngine } from '../goals/goalEngine.ts';
import { logger } from '../../../utils/logger.ts';

export interface ExecutePlanningParams {
  organizationId: string;
  propertyId: string;
  actor?: string;
  existingPlanId?: string;
}

export class StrategicPlanningEngine {
  constructor() {
    // Inscrever no Scheduler para gatilhos automáticos
    strategicScheduler.registerTriggerCallback(async (trigger: PlanningTrigger) => {
      await this.runStrategicPlanningCycle({
        organizationId: trigger.organizationId,
        propertyId: trigger.propertyId,
        actor: `StrategicScheduler:${trigger.type}`
      });
    });

    // Inscrever no EventBus para autorizações humanas concedidas no Approval Module (ADR-005)
    agentEventBus.subscribe('approval:action_decision', async (event) => {
      const { recommendationId, action, decisionBy } = event.payload || {};
      if (action === 'approved' && recommendationId) {
        await this.handleApprovedStrategicRecommendation(recommendationId, decisionBy || 'HumanOperator');
      }
    });
  }

  /**
   * Executa o Ciclo do Cérebro Executivo:
   * Strategic Analysis -> Strategic Simulation -> Confidence Evaluation -> Decision Proposal -> Approval Center (ADR-005)
   * 
   * IMPORTANTE: O Strategic Planning Engine NUNCA instala missões diretamente no GoalEngine.
   */
  public async runStrategicPlanningCycle(params: ExecutePlanningParams): Promise<StrategicPlan> {
    const { organizationId, propertyId, actor = 'ExecutiveBrain', existingPlanId } = params;
    logger.info(`[StrategicPlanningEngine] Executando ciclo de planejamento estratégico para org='${organizationId}', prop='${propertyId}'`, { organizationId, propertyId }, 'STRATEGIC_PLANNING');

    // 1. Strategic Analysis (Análise Contínua de KPIs, Riscos, Oportunidades, Prioridades)
    const analysis = await strategicAnalyzer.analyzeProperty(organizationId, propertyId);

    // 2. Formatar e Versionar o Plano Estratégico + XAI Recomendations
    const plan = strategicPlanner.createOrUpdatePlan(analysis, actor, existingPlanId);

    // 3. Strategic Simulation & Confidence Evaluation (já computados em `plan.simulation`)
    const simulation = plan.simulation;
    const confidenceScore = simulation?.confidenceScore ?? 0.85;

    // 4. Transformar Recomendações em Propostas de Decisão e Enviar ao Approval Module (ADR-005)
    for (const rec of plan.recommendations) {
      if (rec.confidenceScore >= 0.75) {
        await this.submmitRecommendationToApprovalCenter(rec);
      } else {
        logger.warn(`[StrategicPlanningEngine] Recomendação '${rec.recommendationId}' ignorada devido a confidenceScore baixo (${rec.confidenceScore} < 0.75)`);
      }
    }

    // 5. Atualizar Estado na Memória Compartilhada dos Agentes (AgentSharedMemory)
    const scope = { organizationId, propertyId, sessionId: `planning_${organizationId}_${propertyId}` };
    agentSharedMemory.setValue('activeStrategicPlan', plan, 'strategic_planning', scope, 1000 * 60 * 60 * 24);

    // 6. Publicar Eventos Estratégicos no EventBus
    agentEventBus.publishEvent({
      eventName: 'planning:plan_created',
      organizationId,
      propertyId,
      publisherAgentId: 'strategic_planning_engine',
      payload: {
        planId: plan.planId,
        version: plan.version,
        recommendationsCount: plan.recommendations.length,
        confidenceScore,
        simulationSummary: simulation?.simulationSummary
      }
    });

    return plan;
  }

  /**
   * Submete a Recomendação do Strategic Planning Engine ao Approval Center para Governança Humana (ADR-005).
   */
  private async submmitRecommendationToApprovalCenter(rec: ExplainableRecommendation): Promise<void> {
    const recId = rec.recommendationId;
    
    // Submeter proposta ao Approval Repository
    await approvalRepository.submitRecommendation({
      recommendationId: recId,
      title: rec.title,
      description: rec.description,
      impact: rec.expectedImpact.expectedChange,
      urgency: rec.risks.some(r => r.severity === 'CRITICAL') ? 'critical' : 'high',
      metricTarget: rec.kpisUsed.map(k => `${k.kpiName}: ${k.currentValue} -> ${k.targetValue}`).join('; '),
      actionType: rec.actionType,
      targetGoalTemplateId: rec.targetGoalTemplateId,
      targetGoalId: rec.targetGoalId,
      xaiJustification: rec.justificationText,
      confidenceScore: rec.confidenceScore,
      evidenceList: rec.evidence,
      moduleOrigin: 'strategic_planning',
      organizationId: rec.organizationId,
      propertyId: rec.propertyId
    });

    agentEventBus.publishEvent({
      eventName: 'planning:recommendation_proposed',
      organizationId: rec.organizationId,
      propertyId: rec.propertyId,
      publisherAgentId: 'strategic_planning_engine',
      payload: {
        recommendationId: recId,
        planId: rec.planId,
        title: rec.title,
        actionType: rec.actionType,
        confidenceScore: rec.confidenceScore
      }
    });

    logger.info(`[StrategicPlanningEngine] Proposta de Decisão '${recId}' enviada com sucesso para o Approval Center (ADR-005).`, { recommendationId: recId }, 'STRATEGIC_PLANNING');
  }

  /**
   * Processa uma Recomendação Estratégica que foi explicitamente aprovada por operador humano via ADR-005.
   * Somente neste momento é realizada a chamada ao Goal Engine para criar ou modificar Missões.
   */
  public async handleApprovedStrategicRecommendation(recommendationId: string, approverUser: string): Promise<void> {
    logger.info(`[StrategicPlanningEngine] Processando recomendação aprovada por humano '${recommendationId}' (Aprovador: ${approverUser})`, { recommendationId }, 'STRATEGIC_PLANNING');

    // Encontrar a recomendação nos planos salvos
    let foundRec: ExplainableRecommendation | undefined = undefined;
    for (const plan of Array.from((strategicPlanner as any).planStore.values()) as StrategicPlan[]) {
      const match = plan.recommendations.find(r => r.recommendationId === recommendationId);
      if (match) {
        foundRec = match;
        break;
      }
    }

    if (!foundRec) {
      logger.warn(`[StrategicPlanningEngine] Recomendação '${recommendationId}' não encontrada no repositório de planos.`);
      return;
    }

    if (foundRec.actionType === 'CREATE_GOAL' && foundRec.targetGoalTemplateId) {
      logger.info(`[StrategicPlanningEngine] Instanciando Missão Estratégica no GoalEngine após aprovação ADR-005: Template '${foundRec.targetGoalTemplateId}'`);
      
      const createdGoal = goalEngine.createGoal({
        templateId: foundRec.targetGoalTemplateId,
        organizationId: foundRec.organizationId,
        propertyId: foundRec.propertyId,
        actor: `HumanApproved:${approverUser}`
      });

      // Planejar e Iniciar Execução da Missão no GoalEngine
      goalEngine.planGoal(createdGoal.goalId, `HumanApproved:${approverUser}`);
      await goalEngine.executeGoal(createdGoal.goalId, `HumanApproved:${approverUser}`);

    } else if (foundRec.actionType === 'PAUSE_GOAL' && foundRec.targetGoalId) {
      logger.info(`[StrategicPlanningEngine] Pausando Missão Estratégica '${foundRec.targetGoalId}' no GoalEngine após aprovação ADR-005.`);
      goalEngine.pauseGoal(foundRec.targetGoalId, 'Pausa aprovada pelo Cérebro Executivo', `HumanApproved:${approverUser}`);
    }
  }

  public getActivePlan(organizationId: string, propertyId: string): StrategicPlan | undefined {
    const plans = strategicPlanner.listPlans(organizationId, propertyId);
    return plans.find(p => p.status === 'PROPOSED' || p.status === 'ACTIVE' || p.status === 'APPROVED');
  }
}

export const strategicPlanningEngine = new StrategicPlanningEngine();
