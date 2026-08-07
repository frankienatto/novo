import { describe, it, expect, beforeEach } from 'vitest';
import { strategicPlanningEngine } from './strategicPlanningEngine.ts';
import { strategicPlanner } from './strategicPlanner.ts';
import { strategicAnalyzer } from './strategicAnalyzer.ts';
import { strategicForecastEngine } from './strategicForecastEngine.ts';
import { strategicRiskAnalyzer } from './strategicRiskAnalyzer.ts';
import { strategicScheduler } from './strategicScheduler.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { goalRegistry } from '../goals/goalRegistry.ts';
import { goalEngine } from '../goals/goalEngine.ts';
import { approvalRepository } from '../../approval/approvalRepository.ts';

describe('FASE 4.0 — Strategic Planning Engine (Executive Brain)', () => {
  beforeEach(() => {
    agentEventBus.clearHistory();
    agentSharedMemory.clear();
    goalRegistry.clear();
    strategicPlanner.clear();
    strategicScheduler.clearTriggers();
  });

  it('1. Deve analisar indicadores e identificar riscos e oportunidades operacionais em formato de snapshot', async () => {
    const analysis = await strategicAnalyzer.analyzeProperty('org_brain_test', 'prop_brain_test');

    expect(analysis.snapshot).toBeDefined();
    expect(analysis.snapshot.organizationId).toBe('org_brain_test');
    expect(analysis.snapshot.propertyId).toBe('prop_brain_test');
    expect(analysis.detectedRisks.length).toBeGreaterThan(0);
    expect(analysis.detectedOpportunities.length).toBeGreaterThan(0);
    expect(analysis.forecastSummary.thirtyDayRevPARProjection).toBeGreaterThan(0);
    expect(analysis.priorityFocusAreas.length).toBeGreaterThan(0);
  });

  it('2. Deve aplicar versionamento completo e audit trail em Planos Estratégicos', async () => {
    const analysis = await strategicAnalyzer.analyzeProperty('org_ver_test', 'prop_ver_test');
    
    // Versão 1
    const planV1 = strategicPlanner.createOrUpdatePlan(analysis, 'TestActor');
    expect(planV1.version).toBe(1);
    expect(planV1.status).toBe('PROPOSED');
    expect(planV1.auditTrail.length).toBe(1);
    expect(planV1.auditTrail[0].action).toBe('PLAN_CREATED');

    // Versão 2 (Atualização de Plano)
    const planV2 = strategicPlanner.createOrUpdatePlan(analysis, 'TestActor', planV1.planId);
    expect(planV2.version).toBe(2);
    expect(planV2.supersedesPlanId).toBe(planV1.planId);
    expect(planV2.auditTrail.length).toBe(2);
    expect(planV2.auditTrail[1].action).toBe('PLAN_VERSION_UPDATED');

    // Plano original V1 deve ter sido marcado como SUPERSEDED
    const retrievedV1 = strategicPlanner.getPlan(planV1.planId);
    expect(retrievedV1?.status).toBe('SUPERSEDED');
  });

  it('3. Deve fornecer Explainable AI (XAI) completo com todos os 7 atributos obrigatórios em cada recomendação', async () => {
    const analysis = await strategicAnalyzer.analyzeProperty('org_xai_test', 'prop_xai_test');
    const plan = strategicPlanner.createOrUpdatePlan(analysis, 'XAI_Checker');

    expect(plan.recommendations.length).toBeGreaterThan(0);

    for (const rec of plan.recommendations) {
      expect(rec.kpisUsed).toBeDefined();
      expect(rec.kpisUsed.length).toBeGreaterThan(0);
      expect(rec.evidence).toBeDefined();
      expect(rec.evidence.length).toBeGreaterThan(0);
      expect(typeof rec.confidenceScore).toBe('number');
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.confidenceScore).toBeLessThanOrEqual(1);
      expect(rec.expectedImpact).toBeDefined();
      expect(rec.expectedImpact.metric).toBeDefined();
      expect(rec.risks).toBeDefined();
      expect(rec.alternativesConsidered).toBeDefined();
      expect(rec.alternativesConsidered.length).toBeGreaterThan(0);
      expect(rec.justificationText).toBeDefined();
      expect(rec.justificationText).toContain('Análise XAI');
    }
  });

  it('4. O Strategic Planning Engine NUNCA deve criar Missões diretamente no Goal Engine durante o ciclo de planejamento', async () => {
    await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: 'org_no_direct_create',
      propertyId: 'prop_no_direct_create'
    });

    // Nenhuma missão deve ter sido instalada no GoalRegistry diretamente pelo Planning Engine
    const goalsInRegistry = goalRegistry.listGoals({
      organizationId: 'org_no_direct_create',
      propertyId: 'prop_no_direct_create'
    });

    expect(goalsInRegistry.length).toBe(0);
  });

  it('5. Deve submeter propostas ao Approval Center e sincronizar com o Agent Shared Memory e Event Bus', async () => {
    const plan = await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: 'org_flow_test',
      propertyId: 'prop_flow_test'
    });

    const scope = { organizationId: 'org_flow_test', propertyId: 'prop_flow_test', sessionId: 'planning_org_flow_test_prop_flow_test' };

    // Verificar se o plano foi sincronizado na Memória Compartilhada
    const sharedPlan = agentSharedMemory.getValue('activeStrategicPlan', scope);
    expect(sharedPlan).toBeDefined();
    expect(sharedPlan.planId).toBe(plan.planId);

    // Verificar publicação do evento planning:plan_created no EventBus
    const publishedEvents = agentEventBus.getEventHistory({ eventName: 'planning:plan_created' });
    expect(publishedEvents.length).toBeGreaterThan(0);
    expect(publishedEvents[0].organizationId).toBe('org_flow_test');

    // Verificar se a proposta chegou no Approval Repository (ADR-005)
    const pendingApprovals = await approvalRepository.getPendingApprovals('org_flow_test', 'prop_flow_test');
    expect(pendingApprovals.length).toBeGreaterThan(0);
    expect(pendingApprovals[0].moduleOrigin).toBe('strategic_planning');
  });

  it('6. Deve seguir o fluxo completo: Strategic Analysis -> Proposal -> ADR-005 Approval -> Goal Engine instanciado', async () => {
    // 1 e 2. Análise, Plano e Proposta
    const plan = await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: 'org_e2e_brain',
      propertyId: 'prop_e2e_brain'
    });

    const pending = await approvalRepository.getPendingApprovals('org_e2e_brain', 'prop_e2e_brain');
    expect(pending.length).toBeGreaterThan(0);

    const firstProposal = pending[0];

    // 3. Simulação de Aprovação Humana via Approval Module (ADR-005)
    await approvalRepository.approveRecommendation(
      {
        recommendationId: firstProposal.recommendationId,
        decisionBy: 'CEO_Director',
        reason: 'Aprovado alinhamento estratégico de baixa temporada.'
      },
      'org_e2e_brain',
      'prop_e2e_brain'
    );

    // 4. Somente após a aprovação humana a missão deve ser instanciada e executada no GoalEngine
    const goalsAfterApproval = goalRegistry.listGoals({
      organizationId: 'org_e2e_brain',
      propertyId: 'prop_e2e_brain'
    });

    expect(goalsAfterApproval.length).toBeGreaterThan(0);
    expect(goalsAfterApproval[0].status).toBeDefined();
  });
});
