import { decisionService } from '../decision/decisionService.ts';
import { executiveCopilotService } from '../executiveCopilot/executiveCopilotService.ts';
import { strategyService } from '../strategy/strategyService.ts';
import { goalEngine } from '../ai/goals/goalEngine.ts';
import { agentEventBus } from '../ai/orchestrator/agentEventBus.ts';
import { logger } from '../../utils/logger.ts';
import { 
  ApprovalRecord, 
  ApprovalStatus, 
  ApprovalDashboard, 
  ActionDecisionParams,
  ApprovalSummaryForAI
} from './approvalTypes.ts';

export class ApprovalRepository {
  private approvalRecordsStore: Map<string, ApprovalRecord> = new Map();

  /**
   * Constrói ou recupera os registros de aprovação auditáveis consolidados.
   */
  async getApprovalRecords(organizationId: string, propertyId: string): Promise<ApprovalRecord[]> {
    // 1. Coletar recomendações ativas do Decision Engine
    const decisionDash = await decisionService.getDashboard(organizationId, propertyId).catch(() => null);
    const decisionRecs = decisionDash?.executiveActionQueue || [];

    // 2. Coletar riscos/oportunidades do Executive Copilot
    const copilotDash = await executiveCopilotService.getDashboard(organizationId, propertyId).catch(() => null);
    const copilotRisks = copilotDash?.topRisks || [];

    // 3. Coletar cenários estratégicos do Strategy Service
    const strategyScenarios = await strategyService.getScenarios(organizationId, propertyId).catch(() => null) || [];

    // 4. Coletar tarefas do Goal Engine que exigem aprovação humana (ADR-005)
    const activeGoals = goalEngine.listGoals({ organizationId, propertyId });

    const now = new Date().toISOString();

    for (const g of activeGoals) {
      for (const task of g.tasks) {
        if (task.status === 'WAITING_APPROVAL') {
          const recId = task.taskId;
          if (!this.approvalRecordsStore.has(recId)) {
            const record: ApprovalRecord = {
              approvalId: `appr_goal_${recId}`,
              recommendationId: recId,
              title: `[Missão Estratégica: ${g.definition.title}] ${task.title}`,
              description: task.description,
              decisionBy: 'Pendente de Operador Humano (ADR-005)',
              decisionDate: '',
              reason: `Resultado Esperado: ${task.expectedOutcome}`,
              comments: `Goal ID: ${g.goalId}`,
              status: 'pending_approval',
              priority: g.definition.priority === 'CRITICAL' ? 'critical' : g.definition.priority === 'HIGH' ? 'high' : 'medium',
              originalRecommendation: { goalId: g.goalId, taskId: task.taskId },
              moduleOrigin: 'goal_engine',
              correlationId: `corr_goal_${g.goalId}`,
              requestId: `req_goal_${task.taskId}`,
              organizationId,
              propertyId,
              createdAt: g.updatedAt || now,
              updatedAt: now
            };
            this.approvalRecordsStore.set(recId, record);
          }
        }
      }
    }

    // Mapear recomendações do Decision Engine para o store se não existirem
    for (const rec of decisionRecs) {
      if (!this.approvalRecordsStore.has(rec.recommendationId)) {
        const record: ApprovalRecord = {
          approvalId: `appr_${rec.recommendationId}`,
          recommendationId: rec.recommendationId,
          title: rec.title,
          description: rec.description,
          decisionBy: 'Pendente de Operador Humano',
          decisionDate: '',
          reason: rec.reason || '',
          comments: '',
          status: 'pending_approval',
          priority: rec.priority || 'medium',
          originalRecommendation: rec,
          moduleOrigin: rec.sourceModule || 'decision_engine',
          correlationId: `corr_dec_${rec.recommendationId}`,
          requestId: `req_dec_${rec.recommendationId}`,
          organizationId,
          propertyId,
          createdAt: rec.createdAt || now,
          updatedAt: now
        };
        this.approvalRecordsStore.set(rec.recommendationId, record);
      }
    }

    // Mapear riscos críticos do Copilot para aprovação se relevante
    for (const risk of copilotRisks) {
      const recId = `rec_copilot_risk_${risk.riskId}`;
      if (!this.approvalRecordsStore.has(recId)) {
        const record: ApprovalRecord = {
          approvalId: `appr_${recId}`,
          recommendationId: recId,
          title: `[Risco Operacional] ${risk.title}`,
          description: risk.description,
          decisionBy: 'Pendente de Operador Humano',
          decisionDate: '',
          reason: risk.mitigationStrategy,
          comments: '',
          status: 'pending_approval',
          priority: risk.severity === 'high' ? 'critical' : risk.severity === 'medium' ? 'high' : 'medium',
          originalRecommendation: risk,
          moduleOrigin: 'executive_copilot',
          correlationId: `corr_cop_${risk.riskId}`,
          requestId: `req_cop_${risk.riskId}`,
          organizationId,
          propertyId,
          createdAt: now,
          updatedAt: now
        };
        this.approvalRecordsStore.set(recId, record);
      }
    }

    // Mapear cenários do Strategy Module para aprovação
    for (const scen of strategyScenarios) {
      const recId = `rec_strategy_${scen.scenarioId}`;
      if (!this.approvalRecordsStore.has(recId)) {
        const record: ApprovalRecord = {
          approvalId: `appr_${recId}`,
          recommendationId: recId,
          title: `[Simulação Estratégica] ${scen.title}`,
          description: scen.description,
          decisionBy: 'Pendente de Operador Humano',
          decisionDate: '',
          reason: scen.explainableAi?.reasoning || scen.financialImpact?.description || '',
          comments: '',
          status: 'pending_approval',
          priority: 'high',
          originalRecommendation: scen,
          moduleOrigin: 'strategic_simulation',
          correlationId: `corr_strat_${scen.scenarioId}`,
          requestId: `req_strat_${scen.scenarioId}`,
          organizationId,
          propertyId,
          createdAt: scen.createdAt || now,
          updatedAt: now
        };
        this.approvalRecordsStore.set(recId, record);
      }
    }

    // Retorna todos os registros filtrados pelo org/property
    return Array.from(this.approvalRecordsStore.values()).filter(
      r => r.organizationId === organizationId && r.propertyId === propertyId
    );
  }

  /**
   * Obtém apenas pendentes de aprovação.
   */
  async getPendingApprovals(organizationId: string, propertyId: string): Promise<ApprovalRecord[]> {
    const records = await this.getApprovalRecords(organizationId, propertyId);
    return records.filter(r => r.status === 'pending_approval');
  }

  /**
   * Obtém o histórico completo de decisões.
   */
  async getApprovalHistory(organizationId: string, propertyId: string): Promise<ApprovalRecord[]> {
    const records = await this.getApprovalRecords(organizationId, propertyId);
    return records.filter(r => r.status !== 'pending_approval');
  }

  /**
   * Transiciona o estado de uma recomendação para 'approved'.
   */
  async approveRecommendation(params: ActionDecisionParams, orgId: string, propId: string): Promise<ApprovalRecord> {
    const records = await this.getApprovalRecords(orgId, propId);
    let record = records.find(r => r.recommendationId === params.recommendationId || r.approvalId === params.recommendationId);

    if (!record) {
      // Se não encontrar, cria dinamicamente
      record = {
        approvalId: `appr_${params.recommendationId}`,
        recommendationId: params.recommendationId,
        title: `Recomendação ${params.recommendationId}`,
        description: 'Recomendação enviada para fluxo de aprovação humana',
        decisionBy: params.decisionBy || 'Gerente Geral / Operador',
        decisionDate: new Date().toISOString(),
        reason: params.reason || 'Aprovado após análise de viabilidade e impacto',
        comments: params.comments || 'Aprovação executada manualmente no painel de governança',
        status: 'approved',
        priority: 'high',
        originalRecommendation: null,
        moduleOrigin: 'decision_engine',
        correlationId: `corr_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        organizationId: orgId,
        propertyId: propId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.approvalRecordsStore.set(params.recommendationId, record);
    } else {
      record.status = 'approved';
      record.decisionBy = params.decisionBy || 'Gerente Geral / Operador';
      record.decisionDate = new Date().toISOString();
      record.reason = params.reason || record.reason || 'Aprovado após avaliação humana de trade-offs';
      record.comments = params.comments || record.comments || 'Aprovado via Human Approval Workflow';
      record.updatedAt = new Date().toISOString();
      this.approvalRecordsStore.set(record.recommendationId, record);
    }

    if (record.moduleOrigin === 'goal_engine' && record.originalRecommendation) {
      const orig = record.originalRecommendation as any;
      if (orig.goalId && orig.taskId) {
        await goalEngine.approveGoalTask(orig.goalId, orig.taskId, params.decisionBy || 'ApprovalEngine').catch(err => {
          logger.warn(`⚠️ [ApprovalRepository] Erro ao sincronizar aprovação no GoalEngine: ${err?.message}`);
        });
      }
    }

    // Emitir evento de decisão aprovada para que o StrategicPlanningEngine ou outros módulos processem
    agentEventBus.publishEvent({
      eventName: 'approval:action_decision',
      organizationId: orgId,
      propertyId: propId,
      publisherAgentId: 'approval_repository',
      payload: {
        recommendationId: record.recommendationId,
        action: 'approved',
        decisionBy: params.decisionBy || 'HumanOperator',
        reason: params.reason
      }
    });

    return record;
  }

  /**
   * Submete uma nova recomendação vinda de módulos da plataforma (ex: StrategicPlanningEngine) para o fluxo de aprovação pendente.
   */
  async submitRecommendation(params: {
    recommendationId: string;
    title: string;
    description: string;
    impact?: string;
    urgency?: string;
    metricTarget?: string;
    actionType?: string;
    targetGoalTemplateId?: string;
    targetGoalId?: string;
    xaiJustification?: string;
    confidenceScore?: number;
    evidenceList?: string[];
    moduleOrigin: string;
    organizationId: string;
    propertyId: string;
  }): Promise<ApprovalRecord> {
    const now = new Date().toISOString();
    const record: ApprovalRecord = {
      approvalId: `appr_${params.recommendationId}`,
      recommendationId: params.recommendationId,
      title: params.title,
      description: params.description,
      decisionBy: 'Pendente de Operador Humano (ADR-005)',
      decisionDate: '',
      reason: params.xaiJustification || params.description,
      comments: params.impact ? `Impacto Esperado: ${params.impact}` : '',
      status: 'pending_approval',
      priority: params.urgency === 'critical' ? 'critical' : params.urgency === 'high' ? 'high' : 'medium',
      originalRecommendation: params,
      moduleOrigin: params.moduleOrigin,
      correlationId: `corr_${params.recommendationId}`,
      requestId: `req_${params.recommendationId}`,
      organizationId: params.organizationId,
      propertyId: params.propertyId,
      createdAt: now,
      updatedAt: now
    };

    this.approvalRecordsStore.set(params.recommendationId, record);
    return record;
  }

  /**
   * Transiciona o estado de uma recomendação para 'rejected'.
   */
  async rejectRecommendation(params: ActionDecisionParams, orgId: string, propId: string): Promise<ApprovalRecord> {
    const records = await this.getApprovalRecords(orgId, propId);
    let record = records.find(r => r.recommendationId === params.recommendationId || r.approvalId === params.recommendationId);

    if (!record) {
      record = {
        approvalId: `appr_${params.recommendationId}`,
        recommendationId: params.recommendationId,
        title: `Recomendação ${params.recommendationId}`,
        description: 'Recomendação avaliada e rejeitada pelo operador humano',
        decisionBy: params.decisionBy || 'Gerente Geral / Operador',
        decisionDate: new Date().toISOString(),
        reason: params.reason || 'Rejeitado devido a restrições operacionais ou comerciais',
        comments: params.comments || 'Decisão humana de não prosseguir com esta recomendação',
        status: 'rejected',
        priority: 'medium',
        originalRecommendation: null,
        moduleOrigin: 'decision_engine',
        correlationId: `corr_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        organizationId: orgId,
        propertyId: propId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.approvalRecordsStore.set(params.recommendationId, record);
    } else {
      record.status = 'rejected';
      record.decisionBy = params.decisionBy || 'Gerente Geral / Operador';
      record.decisionDate = new Date().toISOString();
      record.reason = params.reason || record.reason || 'Rejeitado após avaliação humana';
      record.comments = params.comments || record.comments || 'Rejeitado no fluxo de aprovação';
      record.updatedAt = new Date().toISOString();
      this.approvalRecordsStore.set(record.recommendationId, record);
    }

    return record;
  }

  /**
   * Retorna o Approval Dashboard.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ApprovalDashboard> {
    const records = await this.getApprovalRecords(organizationId, propertyId);

    const pending = records.filter(r => r.status === 'pending_approval');
    const approved = records.filter(r => r.status === 'approved');
    const rejected = records.filter(r => r.status === 'rejected');
    const cancelled = records.filter(r => r.status === 'cancelled');
    const implementedManually = records.filter(r => r.status === 'implemented_manually');

    const distributionByModule: Record<string, number> = {};
    const distributionByPriority: Record<string, number> = {};

    records.forEach(r => {
      distributionByModule[r.moduleOrigin] = (distributionByModule[r.moduleOrigin] || 0) + 1;
      distributionByPriority[r.priority] = (distributionByPriority[r.priority] || 0) + 1;
    });

    const recentHistory = records
      .filter(r => r.status !== 'pending_approval')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      cancelledCount: cancelled.length,
      implementedManuallyCount: implementedManually.length,
      averageApprovalTimeMinutes: 14,
      averageResponseTimeHours: 1.2,
      backlogCount: pending.length,
      distributionByModule,
      distributionByPriority,
      pendingItems: pending,
      recentHistory,
      systemStatus: 'read_only_governance'
    };
  }

  /**
   * Retorna o resumo para o ContextService da IA.
   */
  async getApprovalSummaryForAI(organizationId: string, propertyId: string): Promise<ApprovalSummaryForAI> {
    const dash = await this.getDashboard(organizationId, propertyId);
    const pendingItems = dash.pendingItems;

    let oldestPending = 'Nenhuma recomendação pendente';
    if (pendingItems.length > 0) {
      const sorted = [...pendingItems].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      oldestPending = `${sorted[0].title} (criada em ${sorted[0].createdAt.split('T')[0]})`;
    }

    return {
      pending: dash.pendingCount,
      approvedToday: dash.approvedCount,
      rejectedToday: dash.rejectedCount,
      averageApprovalTime: `${dash.averageApprovalTimeMinutes} minutos`,
      oldestPending
    };
  }
}

export const approvalRepository = new ApprovalRepository();
