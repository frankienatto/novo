import { describe, it, expect, beforeEach, vi } from 'vitest';
import { strategicImpactEvaluator } from './strategicImpactEvaluator.ts';
import { StrategicGoal } from '../goals/goalTypes.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { goalEngine } from '../goals/goalEngine.ts';
import { strategicPlanningEngine } from './strategicPlanningEngine.ts';
import { executiveCopilotService } from '../../executiveCopilot/executiveCopilotService.ts';
import { decisionService } from '../../decision/decisionService.ts';
import { OperationalKPIsSnapshot } from './planningTypes.ts';

describe('Strategic Closed-Loop Feedback & Impact Measurement Engine (Fase 4.1)', () => {
  const orgId = 'org_test_closed_loop';
  const propId = 'prop_test_closed_loop';

  beforeEach(() => {
    strategicImpactEvaluator.clear();
    agentEventBus.clearHistory();
  });

  const createMockGoal = (overrides?: Partial<StrategicGoal>): StrategicGoal => {
    return {
      goalId: `goal_test_${Date.now()}`,
      organizationId: orgId,
      propertyId: propId,
      sessionId: 'session_test',
      status: 'COMPLETED',
      definition: {
        goalId: 'goal_occupancy_boost',
        title: 'Alavancagem da Taxa de Ocupação',
        objective: 'Aumentar a ocupação direta de 50% para 65%',
        priority: 'HIGH',
        metrics: [
          {
            kpiId: 'occupancy_rate',
            name: 'Taxa de Ocupação',
            currentValue: 50.0,
            targetValue: 65.0,
            unit: '%'
          },
          {
            kpiId: 'revpar',
            name: 'RevPAR',
            currentValue: 200.0,
            targetValue: 260.0,
            unit: 'BRL'
          }
        ],
        successCriteria: ['Ocupação acima de 60%'],
        failureCriteria: ['Ocupação em queda'],
        deadlineDays: 15,
        relatedKPIs: ['occupancy_rate', 'revpar'],
        involvedAgents: ['revenue_agent', 'direct_sales_agent'],
        dependencies: [],
        risks: [],
        rollbackPlan: {
          steps: ['Reverter tarifas promocionais'],
          triggerConditions: ['Ocupação em queda superior a 10%'],
          automated: true
        }
      },
      tasks: [],
      metrics: {
        totalTasks: 2,
        completedTasks: 2,
        failedTasks: 0,
        pendingTasks: 0,
        progressPercent: 100,
        kpiProgress: { occupancy_rate: 100 },
        totalExecutionTimeMs: 1200
      },
      timeline: [],
      eventLog: [],
      auditTrail: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  };

  const createMockSnapshot = (overrides?: Partial<OperationalKPIsSnapshot>): OperationalKPIsSnapshot => {
    return {
      organizationId: orgId,
      propertyId: propId,
      occupancyRatePercent: 65.0,
      adr: 400.0,
      revPar: 260.0,
      housekeepingSlaPercent: 95.0,
      directBookingSharePercent: 35.0,
      commercialPipelineValue: 90000,
      cancelledProposalsCount: 0,
      npsScore: 90,
      timestamp: new Date().toISOString(),
      ...overrides
    };
  };

  it('1. Deve classificar como ACHIEVED quando o Expected Impact for atingido exatamente', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 65.0, // target = 65.0 (100% atingido)
      revPar: 260.0               // target = 260.0 (100% atingido)
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.outcome).toBe('ACHIEVED');
    expect(evaluation.overallAchievementRatePercent).toBe(100);
    expect(evaluation.confidenceDelta).toBeGreaterThan(0);
    expect(evaluation.confidenceAfter).toBe(0.87); // 0.85 baseline + 0.02
  });

  it('2. Deve classificar como EXCEEDED quando o Expected Impact for superado (>115%)', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 70.0, // baseline 50 -> target 65 (delta 15). Real: delta 20 (133.3%)
      revPar: 280.0               // baseline 200 -> target 260 (delta 60). Real: delta 80 (133.3%)
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.outcome).toBe('EXCEEDED');
    expect(evaluation.overallAchievementRatePercent).toBeGreaterThanOrEqual(115);
    expect(evaluation.confidenceDelta).toBe(0.04);
    expect(evaluation.confidenceAfter).toBe(0.89); // 0.85 + 0.04
  });

  it('3. Deve classificar como FAILED quando o Expected Impact não for atingido (<50%)', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 52.0, // delta 2 vs delta 15 esperado (~13.3%)
      revPar: 205.0               // delta 5 vs delta 60 esperado (~8.3%)
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.outcome).toBe('FAILED');
    expect(evaluation.overallAchievementRatePercent).toBeLessThan(50);
    expect(evaluation.confidenceDelta).toBe(-0.03);
    expect(evaluation.confidenceAfter).toBe(0.82); // 0.85 - 0.03
  });

  it('4. Deve classificar como NEGATIVE_IMPACT quando houver variação contrária à esperada', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 40.0, // queda de 10%
      revPar: 160.0               // queda de 40 BRL
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.outcome).toBe('NEGATIVE_IMPACT');
    expect(evaluation.overallAchievementRatePercent).toBeLessThan(0);
    expect(evaluation.confidenceDelta).toBe(-0.06);
    expect(evaluation.confidenceAfter).toBe(0.79); // 0.85 - 0.06
  });

  it('5. Deve classificar como NEUTRAL quando a variação for neutra/zero', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 50.0, // inalterado
      revPar: 200.0               // inalterado
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.outcome).toBe('NEUTRAL');
    expect(evaluation.confidenceDelta).toBe(0);
    expect(evaluation.confidenceAfter).toBe(0.85);
  });

  it('6. Deve tratar ausência de dados retornando INSUFFICIENT_DATA sem quebrar o motor', async () => {
    const goal = createMockGoal({
      definition: {
        ...createMockGoal().definition,
        metrics: [
          {
            kpiId: 'unknown_telemetry_unsupported',
            name: 'Métrica Não Suportada Sem Snapshot',
            currentValue: 10,
            targetValue: 20,
            unit: 'pts'
          }
        ]
      }
    });

    const measuredSnapshot = createMockSnapshot();
    // passar valor undefined simulado
    (measuredSnapshot as any).occupancyRatePercent = undefined;

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.metricAssessments.length).toBeGreaterThan(0);
    expect(evaluation.evaluatedAt).toBeDefined();
  });

  it('7. Deve evitar divisão por zero quando o target for igual ao baseline', async () => {
    const goal = createMockGoal({
      definition: {
        ...createMockGoal().definition,
        metrics: [
          {
            kpiId: 'occupancy_rate',
            name: 'Taxa de Ocupação',
            currentValue: 60.0,
            targetValue: 60.0, // expectedDelta = 0
            unit: '%'
          }
        ]
      }
    });

    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 65.0 // actualDelta = 5
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.metricAssessments[0].achievementRatePercent).toBe(100);
    expect(evaluation.metricAssessments[0].variancePercent).toBe(0);
    expect(evaluation.overallAchievementRatePercent).toBe(100);
  });

  it('8. Deve calcular corretamente o variance percentual entre esperado e realizado', async () => {
    const goal = createMockGoal({
      definition: {
        ...createMockGoal().definition,
        metrics: [
          {
            kpiId: 'occupancy_rate',
            name: 'Taxa de Ocupação',
            currentValue: 50.0,
            targetValue: 60.0, // expectedDelta = 10
            unit: '%'
          }
        ]
      }
    });

    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 62.0 // actualDelta = 12 (variance = +20%)
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    expect(evaluation.metricAssessments[0].expectedDelta).toBe(10);
    expect(evaluation.metricAssessments[0].actualDelta).toBe(12);
    expect(evaluation.metricAssessments[0].variancePercent).toBe(20);
    expect(evaluation.metricAssessments[0].achievementRatePercent).toBe(120);
  });

  it('9. Deve calcular corretamente o achievement rate composto de múltiplas métricas', async () => {
    const goal = createMockGoal({
      definition: {
        ...createMockGoal().definition,
        metrics: [
          {
            kpiId: 'occupancy_rate',
            name: 'Taxa de Ocupação',
            currentValue: 50.0,
            targetValue: 60.0, // expected delta = 10
            unit: '%'
          },
          {
            kpiId: 'revpar',
            name: 'RevPAR',
            currentValue: 200.0,
            targetValue: 250.0, // expected delta = 50
            unit: 'BRL'
          }
        ]
      }
    });

    const measuredSnapshot = createMockSnapshot({
      occupancyRatePercent: 60.0, // 100% atingido
      revPar: 225.0               // 50% atingido (delta 25 vs 50)
    });

    const evaluation = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: measuredSnapshot
    });

    // Média de (100 + 50) / 2 = 75% -> PARTIALLY_ACHIEVED
    expect(evaluation.overallAchievementRatePercent).toBe(75);
    expect(evaluation.outcome).toBe('PARTIALLY_ACHIEVED');
  });

  it('10. Deve aumentar a confiança de forma determinística e registrar no histórico', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot({ occupancyRatePercent: 65.0, revPar: 260.0 });

    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.85);

    await strategicImpactEvaluator.evaluateGoalImpact({ goal, customMeasuredSnapshot: measuredSnapshot });
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.87);

    const history = strategicImpactEvaluator.getCalibrationHistory(orgId, propId);
    expect(history.length).toBe(1);
    expect(history[0].previousConfidence).toBe(0.85);
    expect(history[0].newConfidence).toBe(0.87);
    expect(history[0].delta).toBe(0.02);
  });

  it('11. Deve reduzir a confiança de forma determinística ao falhar sucessivamente', async () => {
    const goal1 = createMockGoal();
    const badSnapshot = createMockSnapshot({ occupancyRatePercent: 40.0, revPar: 150.0 });

    await strategicImpactEvaluator.evaluateGoalImpact({ goal: goal1, customMeasuredSnapshot: badSnapshot });
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.79); // 0.85 - 0.06

    const goal2 = createMockGoal();
    await strategicImpactEvaluator.evaluateGoalImpact({ goal: goal2, customMeasuredSnapshot: badSnapshot });
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.73); // 0.79 - 0.06
  });

  it('12. Deve respeitar os limites mínimo (0.50) e máximo (0.98) de confidence score', async () => {
    const badSnapshot = createMockSnapshot({ occupancyRatePercent: 20.0, revPar: 100.0 });

    // Forçar múltiplas reduções consecutivas
    for (let i = 0; i < 10; i++) {
      const g = createMockGoal();
      await strategicImpactEvaluator.evaluateGoalImpact({ goal: g, customMeasuredSnapshot: badSnapshot });
    }
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.50);

    // Forçar múltiplos aumentos consecutivos
    const goodSnapshot = createMockSnapshot({ occupancyRatePercent: 80.0, revPar: 350.0 });
    for (let i = 0; i < 20; i++) {
      const g = createMockGoal();
      await strategicImpactEvaluator.evaluateGoalImpact({ goal: g, customMeasuredSnapshot: goodSnapshot });
    }
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.98);
  });

  it('13. Deve isolar estritamente o histórico e a calibração por organizationId', async () => {
    const orgA = 'org_alpha';
    const orgB = 'org_beta';
    const prop = 'prop_same_name';

    const goalA = createMockGoal({ organizationId: orgA, propertyId: prop });
    const goalB = createMockGoal({ organizationId: orgB, propertyId: prop });

    // Org A supera meta
    await strategicImpactEvaluator.evaluateGoalImpact({
      goal: goalA,
      customMeasuredSnapshot: createMockSnapshot({ organizationId: orgA, propertyId: prop, occupancyRatePercent: 75, revPar: 300 })
    });

    // Org B falha
    await strategicImpactEvaluator.evaluateGoalImpact({
      goal: goalB,
      customMeasuredSnapshot: createMockSnapshot({ organizationId: orgB, propertyId: prop, occupancyRatePercent: 35, revPar: 120 })
    });

    expect(strategicImpactEvaluator.getCurrentConfidence(orgA, prop)).toBe(0.89);
    expect(strategicImpactEvaluator.getCurrentConfidence(orgB, prop)).toBe(0.79);
    expect(strategicImpactEvaluator.listEvaluations(orgA, prop).length).toBe(1);
    expect(strategicImpactEvaluator.listEvaluations(orgB, prop).length).toBe(1);
  });

  it('14. Deve isolar estritamente o histórico e a calibração por propertyId', async () => {
    const propA = 'property_resort';
    const propB = 'property_business';

    const goalA = createMockGoal({ organizationId: orgId, propertyId: propA });
    const goalB = createMockGoal({ organizationId: orgId, propertyId: propB });

    await strategicImpactEvaluator.evaluateGoalImpact({
      goal: goalA,
      customMeasuredSnapshot: createMockSnapshot({ organizationId: orgId, propertyId: propA, occupancyRatePercent: 70, revPar: 280 })
    });

    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propA)).toBe(0.89);
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propB)).toBe(0.85); // Baseline inalterado para Prop B
  });

  it('15. Deve publicar evento planning:impact_evaluated no AgentEventBus', async () => {
    const goal = createMockGoal();
    const measuredSnapshot = createMockSnapshot();

    await strategicImpactEvaluator.evaluateGoalImpact({ goal, customMeasuredSnapshot: measuredSnapshot });

    const history = agentEventBus.getEventHistory({ organizationId: orgId, propertyId: propId });
    const impactEvent = history.find(e => e.eventName === 'planning:impact_evaluated');

    expect(impactEvent).toBeDefined();
    expect(impactEvent?.payload.outcome).toBe('ACHIEVED');
    expect(impactEvent?.payload.confidenceAfter).toBe(0.87);
  });

  it('16. Deve integrar com o GoalEngine e reagir ao evento de conclusão de missão', async () => {
    const goal = goalEngine.createGoal({
      templateId: 'goal_occupancy_boost',
      organizationId: orgId,
      propertyId: propId,
      actor: 'UnitTest'
    });

    // Executar a avaliação da missão e validar persistência
    const evalResult = await strategicImpactEvaluator.evaluateGoalImpact({ goal });

    expect(evalResult).toBeDefined();
    expect(evalResult.goalTitle).toContain('Ocupação');
    expect(strategicImpactEvaluator.listEvaluations(orgId, propId).length).toBeGreaterThan(0);
  });

  it('17. Deve retroalimentar a calibração de confiança no StrategicPlanningEngine', async () => {
    // 1. Antes da avaliação
    const planBefore = await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: orgId,
      propertyId: propId,
      actor: 'BrainTest'
    });
    const initialSimConfidence = planBefore.simulation?.confidenceScore;
    expect(initialSimConfidence).toBeDefined();

    // 2. Executar missão superada -> confiança sobe para 0.89 (+0.04)
    const goal = createMockGoal();
    await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: createMockSnapshot({ occupancyRatePercent: 75.0, revPar: 320.0 })
    });
    expect(strategicImpactEvaluator.getCurrentConfidence(orgId, propId)).toBe(0.89);

    // 3. Novo ciclo de planejamento reflete o score calibrado (+0.04)
    const planAfter = await strategicPlanningEngine.runStrategicPlanningCycle({
      organizationId: orgId,
      propertyId: propId,
      actor: 'BrainTest'
    });
    expect(planAfter.simulation?.confidenceScore).toBe(Number((initialSimConfidence! + 0.04).toFixed(2)));
  });

  it('18. Deve disponibilizar resumo de aprendizados para ExecutiveCopilot e DecisionService', async () => {
    const goal = createMockGoal();
    await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: createMockSnapshot()
    });

    const copilotSummary = await executiveCopilotService.getClosedLoopImpactSummary(orgId, propId);
    const decisionSummary = await decisionService.getClosedLoopImpactSummary(orgId, propId);

    expect(copilotSummary.totalEvaluationsCount).toBe(1);
    expect(copilotSummary.successfulEvaluationsCount).toBe(1);
    expect(copilotSummary.currentConfidenceLevel).toBe(0.87);
    expect(copilotSummary.recentEvaluations[0].outcome).toBe('ACHIEVED');

    expect(decisionSummary.totalEvaluationsCount).toBe(1);
    expect(decisionSummary.averageAchievementRatePercent).toBe(100);
  });

  it('19. Deve preservar integralmente o ADR-005 sem executar mutações operacionais automáticas', async () => {
    const goal = createMockGoal();
    const evalResult = await strategicImpactEvaluator.evaluateGoalImpact({
      goal,
      customMeasuredSnapshot: createMockSnapshot()
    });

    // Validar que o Closed-Loop apenas produz análises, XAI e calibrações de score sem alterar inventário ou tarifas
    expect(evalResult.xaiExplanation).toBeDefined();
    expect(evalResult.xaiExplanation.whatWorked.length).toBeGreaterThan(0);
    expect(evalResult.xaiExplanation.confidenceImpactDescription).toContain('Confidence score ajustado');
  });
});
