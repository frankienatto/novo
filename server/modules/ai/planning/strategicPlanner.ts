import { 
  StrategicPlan, 
  ExplainableRecommendation, 
  StrategicAnalysisResult, 
  PlanAuditEntry 
} from './planningTypes.ts';
import { strategicForecastEngine } from './strategicForecastEngine.ts';
import { goalRegistry } from '../goals/goalRegistry.ts';
import { logger } from '../../../utils/logger.ts';

export class StrategicPlanner {
  private planStore = new Map<string, StrategicPlan>();

  /**
   * Constrói ou atualiza versionadamente um Plano Estratégico (Strategic Plan).
   */
  public createOrUpdatePlan(
    analysis: StrategicAnalysisResult,
    actor: string = 'ExecutiveBrain',
    existingPlanId?: string
  ): StrategicPlan {
    const { snapshot, detectedRisks, detectedOpportunities, priorityFocusAreas } = analysis;
    const now = new Date().toISOString();

    let version = 1;
    let planId = `plan_${snapshot.organizationId}_${snapshot.propertyId}_${Date.now()}`;
    let supersedesPlanId: string | undefined = undefined;
    let existingAudit: PlanAuditEntry[] = [];

    if (existingPlanId && this.planStore.has(existingPlanId)) {
      const prevPlan = this.planStore.get(existingPlanId)!;
      version = prevPlan.version + 1;
      supersedesPlanId = prevPlan.planId;
      planId = `${existingPlanId}_v${version}`;
      existingAudit = [...prevPlan.auditTrail];
      // Marcar o anterior como SUPERSEDED
      prevPlan.status = 'SUPERSEDED';
      prevPlan.updatedAt = now;
      this.planStore.set(prevPlan.planId, prevPlan);
    }

    const auditTrail: PlanAuditEntry[] = [
      ...existingAudit,
      {
        timestamp: now,
        actor,
        action: version === 1 ? 'PLAN_CREATED' : 'PLAN_VERSION_UPDATED',
        details: `Plano Estratégico gerado (Versão ${version}) para ${snapshot.propertyId}.`,
        version
      }
    ];

    const recommendations: ExplainableRecommendation[] = [];

    // Oposição/Análise das Missões Ativas existentes para possíveis pausamentos/cancelamentos
    const activeGoals = goalRegistry.listGoals({
      organizationId: snapshot.organizationId,
      propertyId: snapshot.propertyId
    });

    for (const activeGoal of activeGoals) {
      if (activeGoal.status === 'IN_PROGRESS' || activeGoal.status === 'PLANNED') {
        if (activeGoal.definition.priority === 'LOW' && detectedRisks.some(r => r.severity === 'CRITICAL')) {
          recommendations.push({
            recommendationId: `rec_pause_${activeGoal.goalId}_v${version}`,
            planId,
            version,
            title: `[Pausa Estratégica] Pausar Missão Secundária '${activeGoal.definition.title}'`,
            description: `A missão atual apresenta prioridade inferior em cenário de risco crítico. Recomenda-se pausa para realocação de capacidade do orquestrador.`,
            actionType: 'PAUSE_GOAL',
            targetGoalId: activeGoal.goalId,
            kpisUsed: [
              {
                kpiName: 'Ocupação Operacional',
                currentValue: `${snapshot.occupancyRatePercent}%`,
                targetValue: '60%',
                gap: `${(60 - snapshot.occupancyRatePercent).toFixed(1)}%`,
                unit: '%'
              }
            ],
            evidence: [
              `Missão ID: ${activeGoal.goalId} está em andamento`,
              `Alocação de esforço em prioridade secundária enquanto há risco crítico registrado.`
            ],
            confidenceScore: 0.88,
            expectedImpact: {
              metric: 'Capacidade do Orquestrador de Agentes',
              expectedChange: '+100% de foco nos gargalos críticos',
              timeframeDays: 7
            },
            risks: [
              {
                riskId: `risk_pause_${activeGoal.goalId}`,
                category: 'OPERATIONAL',
                description: 'Atraso na conclusão de metas secundárias não urgentes.',
                severity: 'LOW',
                evidences: ['Postergação do prazo final da missão pausada.'],
                mitigationStrategy: 'Retomada automática assim que os indicadores críticos estabilizarem.'
              }
            ],
            alternativesConsidered: [
              {
                alternativeTitle: 'Manter a missão executando em paralelo',
                pros: ['Continuidade da tarefa secundária.'],
                cons: ['Dispersão do foco dos agentes em tarefas de menor valor imediato.'],
                reasonRejected: 'Riscos operacionais críticos exigem alinhamento prioritário.'
              }
            ],
            justificationText: `Análise XAI: A pausa temporária da missão '${activeGoal.definition.title}' libera agentes colaboradores para concentrar esforços nos gargalos de maior impacto no RevPAR.`,
            organizationId: snapshot.organizationId,
            propertyId: snapshot.propertyId,
            createdAt: now
          });
        }
      }
    }

    // Recomendações de Novas Missões Estratégicas
    if (snapshot.occupancyRatePercent < 60) {
      recommendations.push({
        recommendationId: `rec_create_occ_${snapshot.propertyId}_v${version}`,
        planId,
        version,
        title: 'Proposta de Criação de Missão: Alavancagem da Ocupação na Baixa Temporada',
        description: 'Proposta para criação da missão estratégica de recuperação de ocupação com foco em conversão direta.',
        actionType: 'CREATE_GOAL',
        targetGoalTemplateId: 'goal_occupancy_boost',
        kpisUsed: [
          {
            kpiName: 'Taxa de Ocupação',
            currentValue: `${snapshot.occupancyRatePercent}%`,
            targetValue: '65.0%',
            gap: `${(65.0 - snapshot.occupancyRatePercent).toFixed(1)}%`,
            unit: '%'
          },
          {
            kpiName: 'RevPAR',
            currentValue: `R$ ${snapshot.revPar}`,
            targetValue: 'R$ 280.00',
            gap: `R$ ${(280 - snapshot.revPar).toFixed(2)}`,
            unit: 'BRL'
          }
        ],
        evidence: [
          `Taxa de Ocupação apurada em ${snapshot.occupancyRatePercent}% está abaixo do limite mínimo recomendado de 60%.`,
          `Sinalização de potencial de aumento no RevPAR em até +14% via campanhas diretas.`
        ],
        confidenceScore: 0.92,
        expectedImpact: {
          metric: 'Taxa de Ocupação',
          expectedChange: '+10.5%',
          timeframeDays: 15
        },
        risks: [
          {
            riskId: `risk_occ_plan_v${version}`,
            category: 'FINANCIAL',
            description: 'Concessão excessiva de vantagens na venda direta.',
            severity: 'MEDIUM',
            evidences: ['Redução marginal pontual de tarifa se não acompanhada por diária média.'],
            mitigationStrategy: 'Monitorar ADR mínimo de proteção de margem pelo Revenue Agent.'
          }
        ],
        alternativesConsidered: [
          {
            alternativeTitle: 'Incremento de investimento em mídia paga em OTAs',
            pros: ['Volume rápido de tráfego.'],
            cons: ['Altas comissões (20%+) eroding margem operacional.'],
            reasonRejected: 'Foco no canal direto traz maior margem líquida por unidade de inventário.'
          }
        ],
        justificationText: `Análise XAI: O cenário aponta gap de ${(65.0 - snapshot.occupancyRatePercent).toFixed(1)}% na ocupação. A criação desta missão mobiliza os agentes de Revenue, Reservas Diretas e Vendas em alinhamento comercial estrito.`,
        organizationId: snapshot.organizationId,
        propertyId: snapshot.propertyId,
        createdAt: now
      });
    }

    if (snapshot.cancelledProposalsCount > 0) {
      recommendations.push({
        recommendationId: `rec_create_rec_prop_${snapshot.propertyId}_v${version}`,
        planId,
        version,
        title: 'Proposta de Criação de Missão: Recuperação de Propostas e Orçamentos Cancelados',
        description: 'Proposta para criação de missão focada em engajamento e conversão de orçamentos parados no CRM.',
        actionType: 'CREATE_GOAL',
        targetGoalTemplateId: 'goal_direct_proposal_recovery',
        kpisUsed: [
          {
            kpiName: 'Propostas Comercializadas Não Concluídas',
            currentValue: snapshot.cancelledProposalsCount,
            targetValue: 0,
            gap: snapshot.cancelledProposalsCount,
            unit: 'unidades'
          }
        ],
        evidence: [
          `Total de ${snapshot.cancelledProposalsCount} solicitações registradas sem fechamento definitivo.`
        ],
        confidenceScore: 0.89,
        expectedImpact: {
          metric: 'Conversão Comercial CRM',
          expectedChange: '+35% de propostas recuperadas',
          timeframeDays: 10
        },
        risks: [
          {
            riskId: `risk_prop_v${version}`,
            category: 'REPUTATION',
            description: 'Abordagem excessiva em contatos comerciais.',
            severity: 'LOW',
            evidences: ['Múltiplos contatos sem resposta do cliente.'],
            mitigationStrategy: 'Garantir cadência respeitosa e personalizada com mensagens geradas por IA.'
          }
        ],
        alternativesConsidered: [
          {
            alternativeTitle: 'Descarte das propostas antigas e foco em novos leads',
            pros: ['Custo imediato de contato menor.'],
            cons: ['Perda de receita de clientes já quentes no funil.'],
            reasonRejected: 'Leads no pipeline já possuem intenção de compra demonstrada.'
          }
        ],
        justificationText: `Análise XAI: O resgate de ${snapshot.cancelledProposalsCount} solicitações possui alto potencial de ROI curto por já se encontrarem no estágio final de decisão.`,
        organizationId: snapshot.organizationId,
        propertyId: snapshot.propertyId,
        createdAt: now
      });
    }

    // Ações de Proposta de Decisão
    const actionTypes = recommendations.map(r => r.actionType);
    const simulation = strategicForecastEngine.simulatePlan(planId, snapshot, actionTypes);

    const plan: StrategicPlan = {
      planId,
      version,
      organizationId: snapshot.organizationId,
      propertyId: snapshot.propertyId,
      status: 'PROPOSED',
      period: 'Ciclo Estratégico Vigilante Corrente',
      title: `Plano Estratégico Integrado v${version} (${snapshot.propertyId})`,
      executiveSummary: `Plano estruturado contendo ${recommendations.length} recomendações estratégicas explicáveis. Foco: ${priorityFocusAreas.join('; ')}.`,
      supersedesPlanId,
      createdBy: actor,
      recommendations,
      simulation,
      auditTrail,
      createdAt: now,
      updatedAt: now
    };

    this.planStore.set(planId, plan);
    logger.info(`[StrategicPlanner] Plano '${planId}' v${version} gerado com ${recommendations.length} recomendações.`, { planId, version }, 'STRATEGIC_PLANNING');

    return plan;
  }

  public getPlan(planId: string): StrategicPlan | undefined {
    return this.planStore.get(planId);
  }

  public listPlans(organizationId: string, propertyId: string): StrategicPlan[] {
    return Array.from(this.planStore.values()).filter(
      p => p.organizationId === organizationId && p.propertyId === propertyId
    );
  }

  public clear(): void {
    this.planStore.clear();
  }
}

export const strategicPlanner = new StrategicPlanner();
