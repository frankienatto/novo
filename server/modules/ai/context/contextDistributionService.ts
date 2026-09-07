import {
  ContextualInsight,
  CreateInsightParams,
  ModuleContextFilter,
  ModuleContextSummary,
  OperationalModuleTarget,
  ContextualPriority,
  ContextualStatus,
  ContextualInsightType
} from './contextDistributionTypes.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { logger } from '../../../utils/logger.ts';

const PRIORITY_ORDER: Record<ContextualPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export class ContextDistributionService {
  // Store isolado por chave composta "orgId:propId"
  private insightsStore: Map<string, ContextualInsight[]> = new Map();

  constructor() {
    this.registerEventSubscriptions();
  }

  private buildStoreKey(orgId: string, propId: string): string {
    return `${orgId}:${propId}`;
  }

  /**
   * Registra inscrições automáticas em eventos do ecossistema de inteligência Synapse
   */
  private registerEventSubscriptions(): void {
    // 1. Reagir ao ciclo de planejamento estratégico concluído
    agentEventBus.subscribe('planning:plan_created', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { planId, confidenceScore, simulationSummary } = payload || {};

        this.publishInsight({
          organizationId,
          propertyId,
          targetModules: ['executive', 'revenue', 'pms'],
          source: 'strategic_planning',
          type: 'INSIGHT',
          priority: 'HIGH',
          confidence: confidenceScore ?? 0.85,
          planId,
          title: 'Plano Estratégico Atualizado',
          summary: simulationSummary || 'Novo ciclo de planejamento estratégico processado com recomendações acionáveis.',
          requiresApproval: false
        });
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'planning:plan_created': ${err?.message}`);
      }
    });

    // 2. Reagir à criação de missões estratégicas no GoalEngine
    agentEventBus.subscribe('goal:created', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { goalId, title, definition } = payload || {};
        const targets = this.inferTargetModulesFromKPIs(definition?.relatedKPIs, definition?.involvedAgents);

        this.publishInsight({
          organizationId,
          propertyId,
          targetModules: targets.length > 0 ? targets : ['pms', 'revenue'],
          source: 'goal_engine',
          type: 'GOAL_CONTEXT',
          priority: 'HIGH',
          confidence: 0.90,
          goalId,
          title: `Nova Missão Ativa: ${title || 'Alinhamento Estratégico'}`,
          summary: definition?.objective || `Missão estratégica ${goalId} em andamento.`,
          requiresApproval: false,
          metadata: { relatedKPIs: definition?.relatedKPIs }
        });
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'goal:created': ${err?.message}`);
      }
    });

    // 3. Reagir à conclusão de missões estratégicas no GoalEngine
    agentEventBus.subscribe('goal:completed', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { goalId, title, metrics } = payload || {};

        this.publishInsight({
          organizationId,
          propertyId,
          targetModules: ['executive', 'revenue', 'pms', 'sales'],
          source: 'closed_loop',
          type: 'INSIGHT',
          priority: 'MEDIUM',
          confidence: 0.95,
          goalId,
          title: `Missão Concluída com Sucesso: ${title || goalId}`,
          summary: `Todos os critérios de sucesso da missão foram validados.`,
          requiresApproval: false,
          metadata: { metrics }
        });
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'goal:completed': ${err?.message}`);
      }
    });

    // 4. Reagir a falhas em missões no GoalEngine
    agentEventBus.subscribe('goal:failed', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { goalId, title, reason } = payload || {};

        this.publishInsight({
          organizationId,
          propertyId,
          targetModules: ['executive', 'revenue', 'pms'],
          source: 'closed_loop',
          type: 'ALERT',
          priority: 'CRITICAL',
          confidence: 0.95,
          goalId,
          title: `Alerta: Missão Estratégica Interrompida`,
          summary: `Missão '${title || goalId}' falhou ou foi abortada: ${reason || 'Critérios de falha atingidos'}.`,
          requiresApproval: false
        });
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'goal:failed': ${err?.message}`);
      }
    });

    // 5. Reagir a avaliações do StrategicImpactEvaluator
    agentEventBus.subscribe('planning:impact_evaluated', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { goalId, goalTitle, outcome, achievementRatePercent, confidenceAfter } = payload || {};

        const priority: ContextualPriority = (outcome === 'NEGATIVE_IMPACT' || outcome === 'FAILED') ? 'CRITICAL' : 'MEDIUM';

        this.publishInsight({
          organizationId,
          propertyId,
          targetModules: ['executive', 'revenue'],
          source: 'strategic_impact',
          type: 'INSIGHT',
          priority,
          confidence: confidenceAfter ?? 0.85,
          goalId,
          title: `Avaliação Closed-Loop: ${goalTitle || goalId}`,
          summary: `Desfecho: ${outcome} (Atingimento: ${achievementRatePercent}%).`,
          actualImpact: {
            outcome: outcome || 'ACHIEVED',
            achievementRatePercent: achievementRatePercent ?? 100
          },
          requiresApproval: false
        });
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'planning:impact_evaluated': ${err?.message}`);
      }
    });

    // 6. Reagir a decisões do Approval Center (ADR-005)
    agentEventBus.subscribe('approval:action_decision', async (event) => {
      try {
        const { organizationId, propertyId, payload } = event;
        if (!organizationId || !propertyId) return;

        const { recommendationId, action } = payload || {};
        if (!recommendationId) return;

        const insights = this.getInsightsStore(organizationId, propertyId);
        for (const ins of insights) {
          if (ins.recommendationId === recommendationId) {
            if (action === 'approved') {
              ins.status = 'ACTIVE';
              ins.requiresApproval = false;
            } else if (action === 'rejected') {
              ins.status = 'DISMISSED';
            }
          }
        }
      } catch (err: any) {
        logger.warn(`⚠️ [ContextDistribution] Erro ao processar evento 'approval:action_decision': ${err?.message}`);
      }
    });
  }

  /**
   * Infere módulos operacionais relevantes com base em KPIs e Agentes
   */
  private inferTargetModulesFromKPIs(kpis?: string[], agents?: string[]): OperationalModuleTarget[] {
    const targets = new Set<OperationalModuleTarget>();

    if (Array.isArray(kpis)) {
      for (const kpi of kpis) {
        const lower = kpi.toLowerCase();
        if (lower.includes('occupancy') || lower.includes('revpar') || lower.includes('adr') || lower.includes('rate')) {
          targets.add('revenue');
          targets.add('pms');
          targets.add('reservations');
        }
        if (lower.includes('cleaning') || lower.includes('housekeeping') || lower.includes('turnaround')) {
          targets.add('housekeeping');
          targets.add('pms');
        }
        if (lower.includes('maintenance') || lower.includes('repair') || lower.includes('unit')) {
          targets.add('maintenance');
        }
        if (lower.includes('direct') || lower.includes('sales') || lower.includes('conversion') || lower.includes('lead')) {
          targets.add('sales');
          targets.add('direct_booking');
        }
        if (lower.includes('campaign') || lower.includes('marketing') || lower.includes('cac')) {
          targets.add('marketing');
        }
        if (lower.includes('nps') || lower.includes('checkin') || lower.includes('vip') || lower.includes('reception')) {
          targets.add('reception');
        }
      }
    }

    if (Array.isArray(agents)) {
      for (const agent of agents) {
        const lower = agent.toLowerCase();
        if (lower.includes('revenue')) targets.add('revenue');
        if (lower.includes('reception')) targets.add('reception');
        if (lower.includes('housekeeping')) targets.add('housekeeping');
        if (lower.includes('maintenance')) targets.add('maintenance');
        if (lower.includes('sales') || lower.includes('direct')) {
          targets.add('sales');
          targets.add('direct_booking');
        }
        if (lower.includes('marketing')) targets.add('marketing');
      }
    }

    return Array.from(targets);
  }

  private getInsightsStore(orgId: string, propId: string): ContextualInsight[] {
    const key = this.buildStoreKey(orgId, propId);
    let store = this.insightsStore.get(key);
    if (!store) {
      store = [];
      this.insightsStore.set(key, store);
    }
    return store;
  }

  /**
   * Publica e distribui um novo Insight Contextual no ecossistema
   */
  public publishInsight(params: CreateInsightParams): ContextualInsight {
    const {
      organizationId,
      propertyId,
      targetModules,
      source,
      type,
      priority,
      confidence,
      title,
      summary,
      description,
      goalId,
      planId,
      recommendationId,
      expectedImpact,
      actualImpact,
      requiresApproval = false,
      expiresAt,
      metadata
    } = params;

    if (!organizationId || !propertyId) {
      throw new Error("ContextDistributionService: organizationId e propertyId são obrigatórios e não podem ser vazios.");
    }

    const clampedConfidence = Math.max(0.0, Math.min(1.0, Number((confidence ?? 0.85).toFixed(2))));
    const resolvedRequiresApproval = Boolean(requiresApproval || type === 'RECOMMENDATION');
    const initialStatus: ContextualStatus = resolvedRequiresApproval ? 'PENDING_APPROVAL' : 'ACTIVE';
    const resolvedRecommendationId = recommendationId || (type === 'RECOMMENDATION' ? `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : undefined);

    const insight: ContextualInsight = {
      insightId: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId,
      propertyId,
      targetModules: Array.isArray(targetModules) && targetModules.length > 0 ? targetModules : ['executive'],
      source: source || 'system',
      type: type || 'INSIGHT',
      priority: priority || 'MEDIUM',
      confidence: clampedConfidence,
      title: title || 'Insight Operacional',
      summary: summary || '',
      description,
      goalId,
      planId,
      recommendationId: resolvedRecommendationId,
      expectedImpact,
      actualImpact,
      status: initialStatus,
      requiresApproval: resolvedRequiresApproval,
      createdAt: new Date().toISOString(),
      expiresAt,
      metadata
    };

    // Armazenar no store do tenant
    const store = this.getInsightsStore(organizationId, propertyId);
    store.push(insight);

    // Sincronizar com AgentSharedMemory por módulo
    for (const mod of insight.targetModules) {
      const scope = { organizationId, propertyId, sessionId: `context_${mod}` };
      const currentModInsights = agentSharedMemory.getValue<ContextualInsight[]>(`module_insights_${mod}`, scope) || [];
      agentSharedMemory.setValue(
        `module_insights_${mod}`,
        [...currentModInsights, insight],
        'context_distribution_service',
        scope,
        1000 * 60 * 60 * 24 // 24h TTL
      );
    }

    // Publicar evento correspondente no AgentEventBus
    let eventName = 'context:insight:created';
    if (type === 'ALERT') {
      eventName = 'context:alert:created';
    } else if (type === 'RECOMMENDATION') {
      eventName = 'context:recommendation:created';
    } else if (type === 'GOAL_CONTEXT') {
      eventName = 'context:goal:relevant';
    }

    agentEventBus.publishEvent({
      eventName,
      organizationId,
      propertyId,
      publisherAgentId: 'context_distribution_service',
      payload: {
        insightId: insight.insightId,
        type: insight.type,
        priority: insight.priority,
        targetModules: insight.targetModules,
        title: insight.title,
        summary: insight.summary,
        requiresApproval: insight.requiresApproval,
        confidence: insight.confidence
      }
    });

    return insight;
  }

  /**
   * Retorna os insights contextuais distribuídos para um determinado módulo operacional
   */
  public getInsightsForModule(filter: ModuleContextFilter): ContextualInsight[] {
    const {
      organizationId,
      propertyId,
      module,
      minPriority,
      minConfidence,
      includeExpired = false,
      includePendingApproval = true,
      goalId,
      type,
      limit = 20
    } = filter;

    if (!organizationId || !propertyId) {
      return [];
    }

    const store = this.getInsightsStore(organizationId, propertyId);
    const now = Date.now();

    // Normalizar módulo para matching (ex: reservations é compatível com pms)
    const targetModuleAliases = new Set<string>([module]);
    if (module === 'pms') targetModuleAliases.add('reservations');
    if (module === 'reservations') targetModuleAliases.add('pms');
    if (module === 'sales') targetModuleAliases.add('direct_booking');
    if (module === 'direct_booking') targetModuleAliases.add('sales');

    const filtered = store.filter(insight => {
      // 1. Validação de Tenant
      if (insight.organizationId !== organizationId || insight.propertyId !== propertyId) {
        return false;
      }

      // 2. Validação de Módulo Alvo
      const matchesModule = insight.targetModules.some(m => targetModuleAliases.has(m)) || insight.targetModules.includes('executive');
      if (!matchesModule) {
        return false;
      }

      // 3. Validação de Expiração
      if (insight.expiresAt) {
        const expireTime = new Date(insight.expiresAt).getTime();
        if (expireTime <= now && !includeExpired) {
          return false;
        }
      }

      // 4. Validação de Status
      if (!includeExpired && insight.status === 'EXPIRED') {
        return false;
      }
      if (!includePendingApproval && insight.status === 'PENDING_APPROVAL') {
        return false;
      }
      if (insight.status === 'DISMISSED') {
        return false;
      }

      // 5. Validação de Prioridade
      if (minPriority) {
        const insightPrioLevel = PRIORITY_ORDER[insight.priority] || 1;
        const filterPrioLevel = PRIORITY_ORDER[minPriority] || 1;
        if (insightPrioLevel < filterPrioLevel) {
          return false;
        }
      }

      // 6. Validação de Confiança
      if (minConfidence !== undefined && insight.confidence < minConfidence) {
        return false;
      }

      // 7. Filtro por Objetivo Específico
      if (goalId && insight.goalId !== goalId) {
        return false;
      }

      // 8. Filtro por Tipo
      if (type && insight.type !== type) {
        return false;
      }

      return true;
    });

    // Ordenação determinística: Prioridade (CRITICAL > HIGH > MEDIUM > LOW) -> Confidence DESC -> Mais recente
    filtered.sort((a, b) => {
      const prioDiff = (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1);
      if (prioDiff !== 0) return prioDiff;

      const confDiff = b.confidence - a.confidence;
      if (confDiff !== 0) return confDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered.slice(0, limit);
  }

  /**
   * Retorna resumo executivo de inteligência contextual para um módulo operacional
   */
  public getModuleContextSummary(
    module: OperationalModuleTarget,
    organizationId: string,
    propertyId: string
  ): ModuleContextSummary {
    const activeInsights = this.getInsightsForModule({
      organizationId,
      propertyId,
      module,
      includeExpired: false,
      includePendingApproval: true,
      limit: 50
    });

    const criticalAlertsCount = activeInsights.filter(i => i.priority === 'CRITICAL' && (i.type === 'ALERT' || i.type === 'INSIGHT')).length;
    const pendingRecommendationsCount = activeInsights.filter(i => i.status === 'PENDING_APPROVAL' && i.requiresApproval).length;

    const relatedGoalsSet = new Set<string>();
    for (const ins of activeInsights) {
      if (ins.goalId) relatedGoalsSet.add(ins.goalId);
    }

    return {
      module,
      organizationId,
      propertyId,
      activeInsightsCount: activeInsights.length,
      criticalAlertsCount,
      pendingRecommendationsCount,
      topInsights: activeInsights.slice(0, 5),
      relatedGoals: Array.from(relatedGoalsSet),
      lastUpdatedAt: new Date().toISOString()
    };
  }

  /**
   * Retorna os resumos consolidados de todos os módulos para uma propriedade
   */
  public getAllDistributedSummaries(
    organizationId: string,
    propertyId: string
  ): Record<OperationalModuleTarget, ModuleContextSummary> {
    const modules: OperationalModuleTarget[] = [
      'pms',
      'reservations',
      'reception',
      'housekeeping',
      'maintenance',
      'revenue',
      'sales',
      'direct_booking',
      'marketing',
      'executive'
    ];

    const result = {} as Record<OperationalModuleTarget, ModuleContextSummary>;
    for (const mod of modules) {
      result[mod] = this.getModuleContextSummary(mod, organizationId, propertyId);
    }
    return result;
  }

  /**
   * Reconhece um insight (ACKNOWLEDGED)
   */
  public acknowledgeInsight(insightId: string, organizationId: string, propertyId: string): boolean {
    const store = this.getInsightsStore(organizationId, propertyId);
    const item = store.find(i => i.insightId === insightId);
    if (item && item.status === 'ACTIVE') {
      item.status = 'ACKNOWLEDGED';
      return true;
    }
    return false;
  }

  /**
   * Dispensa um insight (DISMISSED)
   */
  public dismissInsight(insightId: string, organizationId: string, propertyId: string): boolean {
    const store = this.getInsightsStore(organizationId, propertyId);
    const item = store.find(i => i.insightId === insightId);
    if (item) {
      item.status = 'DISMISSED';
      return true;
    }
    return false;
  }

  /**
   * Limpa e expira insights temporários cujo expiresAt já foi ultrapassado
   */
  public cleanExpiredInsights(organizationId?: string, propertyId?: string): number {
    const now = Date.now();
    let expiredCount = 0;

    const processStore = (store: ContextualInsight[]) => {
      for (const ins of store) {
        if (ins.expiresAt && ins.status !== 'EXPIRED') {
          const expireTime = new Date(ins.expiresAt).getTime();
          if (expireTime <= now) {
            ins.status = 'EXPIRED';
            expiredCount++;

            if (ins.type === 'RECOMMENDATION') {
              agentEventBus.publishEvent({
                eventName: 'context:recommendation:expired',
                organizationId: ins.organizationId,
                propertyId: ins.propertyId,
                publisherAgentId: 'context_distribution_service',
                payload: {
                  insightId: ins.insightId,
                  recommendationId: ins.recommendationId,
                  title: ins.title
                }
              });
            }
          }
        }
      }
    };

    if (organizationId && propertyId) {
      processStore(this.getInsightsStore(organizationId, propertyId));
    } else {
      for (const store of this.insightsStore.values()) {
        processStore(store);
      }
    }

    return expiredCount;
  }

  /**
   * Limpa todos os insights em memória para isolamento de testes
   */
  public clearAll(organizationId?: string, propertyId?: string): void {
    if (organizationId && propertyId) {
      this.insightsStore.delete(this.buildStoreKey(organizationId, propertyId));
    } else {
      this.insightsStore.clear();
    }
  }
}

export const contextDistributionService = new ContextDistributionService();
