import { 
  GoalImpactEvaluation, 
  SingleMetricImpactAssessment, 
  ImpactEvaluationOutcome, 
  MeasurementWindowsConfig, 
  ConfidenceCalibrationRecord, 
  OperationalKPIsSnapshot, 
  StrategicClosedLoopSummaryForAI 
} from './planningTypes.ts';
import { StrategicGoal } from '../goals/goalTypes.ts';
import { strategicAnalyzer } from './strategicAnalyzer.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { logger } from '../../../utils/logger.ts';

export interface EvaluateGoalImpactParams {
  goal: StrategicGoal;
  customMeasuredSnapshot?: OperationalKPIsSnapshot;
  windowsConfig?: Partial<MeasurementWindowsConfig>;
}

export class StrategicImpactEvaluator {
  // Limites e pesos determinísticos de calibração de confiança
  private readonly MIN_CONFIDENCE = 0.50;
  private readonly MAX_CONFIDENCE = 0.98;
  private readonly DEFAULT_BASELINE_CONFIDENCE = 0.85;

  // Armazenamento em memória com isolamento estrito de tenant/property
  private evaluationsStore: Map<string, GoalImpactEvaluation> = new Map();
  private calibrationStore: Map<string, ConfidenceCalibrationRecord[]> = new Map();

  constructor() {
    // Inscrever no EventBus para avaliar automaticamente quando uma missão estratégica é concluída
    agentEventBus.subscribe('goal:completed', async (event) => {
      const { goal, goalId } = event.payload || {};
      if (goal && goal.organizationId && goal.propertyId) {
        try {
          await this.evaluateGoalImpact({ goal });
        } catch (err: any) {
          logger.warn(`[StrategicImpactEvaluator] Erro ao avaliar impacto automático da missão '${goalId}': ${err?.message}`);
        }
      }
    });
  }

  private getTenantKey(organizationId: string, propertyId: string): string {
    return `${organizationId}:${propertyId}`;
  }

  /**
   * Obtém o nível atual de confiança calibrado para o tenant/propriedade.
   */
  public getCurrentConfidence(organizationId: string, propertyId: string): number {
    const key = this.getTenantKey(organizationId, propertyId);
    const records = this.calibrationStore.get(key) || [];
    if (records.length === 0) {
      return this.DEFAULT_BASELINE_CONFIDENCE;
    }
    return records[records.length - 1].newConfidence;
  }

  /**
   * Avalia o impacto real pós-execução de uma missão estratégica comparando Expected vs Actual.
   */
  public async evaluateGoalImpact(params: EvaluateGoalImpactParams): Promise<GoalImpactEvaluation> {
    const { goal, customMeasuredSnapshot, windowsConfig } = params;
    const { organizationId, propertyId, goalId } = goal;

    logger.info(`[StrategicImpactEvaluator] Iniciando avaliação de impacto da missão '${goalId}' (${goal.definition.title})`, { goalId, organizationId, propertyId }, 'STRATEGIC_IMPACT');

    // 1. Configurar Janelas de Medição
    const windows: MeasurementWindowsConfig = {
      baselineWindowDays: windowsConfig?.baselineWindowDays ?? 7,
      executionWindowDays: windowsConfig?.executionWindowDays ?? 15,
      measurementWindowDays: windowsConfig?.measurementWindowDays ?? 7
    };

    // 2. Coletar Snapshot Atual/Medido
    let measuredSnapshot: OperationalKPIsSnapshot;
    if (customMeasuredSnapshot) {
      measuredSnapshot = customMeasuredSnapshot;
    } else {
      const analysis = await strategicAnalyzer.analyzeProperty(organizationId, propertyId);
      measuredSnapshot = analysis.snapshot;
    }

    // 3. Avaliar cada métrica definida na missão
    const metricAssessments: SingleMetricImpactAssessment[] = [];
    const whatWorked: string[] = [];
    const whatFailed: string[] = [];
    const learnings: string[] = [];

    const goalMetrics = goal.definition.metrics || [];

    if (goalMetrics.length === 0) {
      // Sem métricas formais registradas
      metricAssessments.push({
        metricName: 'Execução Operacional Geral',
        baselineValue: 0,
        expectedTargetValue: 100,
        expectedDelta: 100,
        actualMeasuredValue: goal.metrics.progressPercent,
        actualDelta: goal.metrics.progressPercent,
        variancePercent: 0,
        achievementRatePercent: goal.metrics.progressPercent,
        unit: '%',
        status: goal.metrics.progressPercent >= 100 ? 'POSITIVE' : 'NEUTRAL'
      });
    } else {
      for (const m of goalMetrics) {
        const baseline = Number(m.currentValue) || 0;
        const target = Number(m.targetValue) || 0;
        const expectedDelta = target - baseline;

        // Mapear valor real medido a partir do snapshot conforme o nome/id da métrica
        const actualMeasured = this.resolveMeasuredMetricValue(m.kpiId, m.name, measuredSnapshot, m.currentValue);
        
        if (actualMeasured === undefined || isNaN(actualMeasured)) {
          metricAssessments.push({
            metricName: m.name,
            baselineValue: baseline,
            expectedTargetValue: target,
            expectedDelta,
            actualMeasuredValue: 0,
            actualDelta: 0,
            variancePercent: 0,
            achievementRatePercent: 0,
            unit: m.unit,
            status: 'INSUFFICIENT_DATA'
          });
          whatFailed.push(`Dados insuficientes para a métrica '${m.name}'.`);
          continue;
        }

        const actualDelta = Number((actualMeasured - baseline).toFixed(2));
        
        let achievementRatePercent = 100;
        let variancePercent = 0;

        if (expectedDelta !== 0) {
          achievementRatePercent = Number(((actualDelta / expectedDelta) * 100).toFixed(1));
          variancePercent = Number((((actualDelta - expectedDelta) / Math.abs(expectedDelta)) * 100).toFixed(1));
        } else if (actualDelta > 0) {
          achievementRatePercent = 100;
          variancePercent = 0;
        } else if (actualDelta < 0) {
          achievementRatePercent = -100;
          variancePercent = -100;
        }

        let status: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'INSUFFICIENT_DATA' = 'NEUTRAL';
        if (achievementRatePercent >= 100) {
          status = 'POSITIVE';
          whatWorked.push(`Métrica '${m.name}' superou a meta esperada (${actualDelta} ${m.unit} vs esperado de ${expectedDelta} ${m.unit}).`);
        } else if (achievementRatePercent >= 60) {
          status = 'POSITIVE';
          whatWorked.push(`Métrica '${m.name}' atingiu progresso substancial de ${achievementRatePercent}%.`);
        } else if (achievementRatePercent > 0) {
          status = 'NEUTRAL';
          whatFailed.push(`Métrica '${m.name}' teve avanço parcial (${achievementRatePercent}% da meta planejada).`);
        } else if (achievementRatePercent < 0) {
          status = 'NEGATIVE';
          whatFailed.push(`Métrica '${m.name}' teve variação contrária à esperada (queda de ${Math.abs(actualDelta)} ${m.unit}).`);
        } else {
          status = 'NEUTRAL';
          whatFailed.push(`Métrica '${m.name}' permaneceu inalterada.`);
        }

        metricAssessments.push({
          metricName: m.name,
          baselineValue: baseline,
          expectedTargetValue: target,
          expectedDelta,
          actualMeasuredValue: actualMeasured,
          actualDelta,
          variancePercent,
          achievementRatePercent,
          unit: m.unit,
          status
        });
      }
    }

    // 4. Determinar Outcome Geral e Taxa de Atingimento Global
    const validAssessments = metricAssessments.filter(a => a.status !== 'INSUFFICIENT_DATA');
    let overallAchievementRate = 0;

    if (validAssessments.length === 0) {
      overallAchievementRate = 0;
    } else {
      const sum = validAssessments.reduce((acc, a) => acc + a.achievementRatePercent, 0);
      overallAchievementRate = Number((sum / validAssessments.length).toFixed(1));
    }

    let outcome: ImpactEvaluationOutcome = 'NEUTRAL';
    if (metricAssessments.every(a => a.status === 'INSUFFICIENT_DATA')) {
      outcome = 'INSUFFICIENT_DATA';
    } else if (overallAchievementRate >= 115) {
      outcome = 'EXCEEDED';
    } else if (overallAchievementRate >= 90) {
      outcome = 'ACHIEVED';
    } else if (overallAchievementRate >= 50) {
      outcome = 'PARTIALLY_ACHIEVED';
    } else if (overallAchievementRate === 0) {
      outcome = 'NEUTRAL';
    } else if (overallAchievementRate < 0) {
      outcome = 'NEGATIVE_IMPACT';
    } else if (overallAchievementRate < 50) {
      outcome = 'FAILED';
    } else {
      outcome = 'NEUTRAL';
    }

    // 5. Calibração Determinística do Confidence Score
    const confidenceBefore = this.getCurrentConfidence(organizationId, propertyId);
    const { confidenceAfter, delta, calibrationReason } = this.calculateConfidenceCalibration(confidenceBefore, outcome, overallAchievementRate);

    // Registrar calibração
    const calibrationRecord: ConfidenceCalibrationRecord = {
      recordId: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organizationId,
      propertyId,
      goalId,
      previousConfidence: confidenceBefore,
      newConfidence: confidenceAfter,
      delta,
      reason: calibrationReason,
      outcome,
      timestamp: new Date().toISOString()
    };

    const tenantKey = this.getTenantKey(organizationId, propertyId);
    const tenantHistory = this.calibrationStore.get(tenantKey) || [];
    tenantHistory.push(calibrationRecord);
    this.calibrationStore.set(tenantKey, tenantHistory);

    // Montar aprendizados e XAI Explanation
    if (outcome === 'EXCEEDED' || outcome === 'ACHIEVED') {
      learnings.push(`A estratégia adotada para '${goal.definition.title}' validou as premissas de precificação e alocação de capacidade.`);
    } else if (outcome === 'PARTIALLY_ACHIEVED') {
      learnings.push(`A meta obteve resultado moderado. Recomenda-se ajustar o horizonte temporal de execução ou refinar os canais de acionamento.`);
    } else if (outcome === 'NEGATIVE_IMPACT' || outcome === 'FAILED') {
      learnings.push(`O plano não produziu o retorno projetado. Necessário revisar a elasticidade de demanda e os gatilhos de mitigação de risco.`);
    } else if (outcome === 'INSUFFICIENT_DATA') {
      learnings.push(`Dados de telemetria insuficientes para consolidar impacto. Manter observabilidade nos próximos ciclos.`);
    }

    const evaluationId = `eval_${goalId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const evaluation: GoalImpactEvaluation = {
      evaluationId,
      goalId,
      organizationId,
      propertyId,
      goalTitle: goal.definition.title,
      outcome,
      overallAchievementRatePercent: overallAchievementRate,
      confidenceBefore,
      confidenceAfter,
      confidenceDelta: delta,
      calibrationReason,
      metricAssessments,
      windows,
      measuredSnapshot,
      evaluatedAt: new Date().toISOString(),
      xaiExplanation: {
        summary: `Avaliação Closed-Loop da missão '${goal.definition.title}': Resultado classificado como ${outcome} com taxa de realização global de ${overallAchievementRate}%.`,
        whatWorked,
        whatFailed,
        learningsAndRecommendations: learnings,
        confidenceImpactDescription: `Confidence score ajustado de ${(confidenceBefore * 100).toFixed(1)}% para ${(confidenceAfter * 100).toFixed(1)}% (${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%). Motivo: ${calibrationReason}`
      }
    };

    // Armazenar avaliação
    this.evaluationsStore.set(evaluationId, evaluation);

    // Sincronizar com a Memória Compartilhada dos Agentes (AgentSharedMemory)
    const memoryScope = { organizationId, propertyId, sessionId: `impact_${organizationId}_${propertyId}` };
    agentSharedMemory.setValue('latestGoalImpactEvaluation', evaluation, 'strategic_planning', memoryScope, 1000 * 60 * 60 * 24);

    // Publicar evento no AgentEventBus
    agentEventBus.publishEvent({
      eventName: 'planning:impact_evaluated',
      organizationId,
      propertyId,
      publisherAgentId: 'strategic_impact_evaluator',
      payload: {
        evaluationId,
        goalId,
        outcome,
        achievementRatePercent: overallAchievementRate,
        confidenceBefore,
        confidenceAfter,
        confidenceDelta: delta,
        calibrationReason
      }
    });

    logger.info(`[StrategicImpactEvaluator] Avaliação concluída com sucesso: outcome='${outcome}', achievementRate=${overallAchievementRate}%, confidence=${confidenceAfter}`, { evaluationId }, 'STRATEGIC_IMPACT');

    return evaluation;
  }

  /**
   * Cálculo determinístico de calibração de confiança limitado por thresholds.
   */
  private calculateConfidenceCalibration(
    currentConfidence: number,
    outcome: ImpactEvaluationOutcome,
    achievementRate: number
  ): { confidenceAfter: number; delta: number; calibrationReason: string } {
    let delta = 0;
    let calibrationReason = '';

    switch (outcome) {
      case 'EXCEEDED':
        delta = +0.04;
        calibrationReason = `Meta superada com taxa de atingimento de ${achievementRate}%. Aumento de confiança na modelagem de impacto.`;
        break;
      case 'ACHIEVED':
        delta = +0.02;
        calibrationReason = `Meta atingida com sucesso (${achievementRate}%). Calibração positiva de confiabilidade das projeções.`;
        break;
      case 'PARTIALLY_ACHIEVED':
        delta = +0.005;
        calibrationReason = `Meta parcialmente atingida (${achievementRate}%). Leve incremento de confiança por progresso comprovado.`;
        break;
      case 'NEUTRAL':
        delta = 0.0;
        calibrationReason = 'Resultado neutro sem variação significativa nas métricas observadas. Confiança inalterada.';
        break;
      case 'FAILED':
        delta = -0.03;
        calibrationReason = `Meta não atingida (${achievementRate}%). Redução preventiva de confiança nas projeções deste perfil.`;
        break;
      case 'NEGATIVE_IMPACT':
        delta = -0.06;
        calibrationReason = `Impacto adverso detectado nas métricas da missão. Redução prudencial de confiança para exigir maior validação humana.`;
        break;
      case 'INSUFFICIENT_DATA':
        delta = 0.0;
        calibrationReason = 'Dados insuficientes para aferição conclusiva. Score de confiança mantido.';
        break;
    }

    const calculated = currentConfidence + delta;
    const clamped = Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE, Number(calculated.toFixed(4))));
    const actualDelta = Number((clamped - currentConfidence).toFixed(4));

    return {
      confidenceAfter: clamped,
      delta: actualDelta,
      calibrationReason
    };
  }

  /**
   * Resolve o valor real medido a partir do snapshot operacional.
   */
  private resolveMeasuredMetricValue(
    kpiId: string, 
    metricName: string, 
    snapshot: OperationalKPIsSnapshot,
    fallbackValue?: number
  ): number {
    const norm = (kpiId + ' ' + metricName).toLowerCase();

    if (norm.includes('occupancy') || norm.includes('ocupação')) {
      return snapshot.occupancyRatePercent;
    }
    if (norm.includes('revpar')) {
      return snapshot.revPar;
    }
    if (norm.includes('adr') || norm.includes('diária média') || norm.includes('diaria media')) {
      return snapshot.adr;
    }
    if (norm.includes('housekeeping') || norm.includes('governança') || norm.includes('sla')) {
      return snapshot.housekeepingSlaPercent;
    }
    if (norm.includes('direct') || norm.includes('diret')) {
      return snapshot.directBookingSharePercent;
    }
    if (norm.includes('pipeline') || norm.includes('vendas') || norm.includes('comercial')) {
      return snapshot.commercialPipelineValue;
    }
    if (norm.includes('proposal') || norm.includes('proposta') || norm.includes('cancelad')) {
      return snapshot.cancelledProposalsCount;
    }
    if (norm.includes('nps') || norm.includes('satisfação')) {
      return snapshot.npsScore;
    }

    return fallbackValue ?? snapshot.occupancyRatePercent;
  }

  /**
   * Retorna todas as avaliações de impacto registradas para um tenant.
   */
  public listEvaluations(organizationId: string, propertyId: string): GoalImpactEvaluation[] {
    return Array.from(this.evaluationsStore.values()).filter(
      e => e.organizationId === organizationId && e.propertyId === propertyId
    );
  }

  /**
   * Retorna o histórico de registros de calibração de confiança para um tenant.
   */
  public getCalibrationHistory(organizationId: string, propertyId: string): ConfidenceCalibrationRecord[] {
    const key = this.getTenantKey(organizationId, propertyId);
    return this.calibrationStore.get(key) || [];
  }

  /**
   * Retorna o resumo executivo de Closed-Loop Feedback para consumo do ExecutiveCopilot e DecisionService.
   */
  public getClosedLoopSummaryForAI(organizationId: string, propertyId: string): StrategicClosedLoopSummaryForAI {
    const evaluations = this.listEvaluations(organizationId, propertyId);
    const successfulCount = evaluations.filter(e => e.outcome === 'EXCEEDED' || e.outcome === 'ACHIEVED').length;
    const failedCount = evaluations.filter(e => e.outcome === 'FAILED' || e.outcome === 'NEGATIVE_IMPACT').length;

    const avgAchievement = evaluations.length > 0
      ? Number((evaluations.reduce((acc, e) => acc + e.overallAchievementRatePercent, 0) / evaluations.length).toFixed(1))
      : 0;

    const currentConfidence = this.getCurrentConfidence(organizationId, propertyId);

    const recent = evaluations.slice(-5).map(e => ({
      goalTitle: e.goalTitle,
      outcome: e.outcome,
      achievementRate: e.overallAchievementRatePercent,
      evaluatedAt: e.evaluatedAt
    }));

    const primaryLearnings: string[] = [];
    if (evaluations.length === 0) {
      primaryLearnings.push('Ainda não há missões concluídas avaliadas pelo Closed-Loop Feedback neste tenant.');
    } else {
      for (const ev of evaluations.slice(-3)) {
        if (ev.xaiExplanation.learningsAndRecommendations.length > 0) {
          primaryLearnings.push(...ev.xaiExplanation.learningsAndRecommendations);
        }
      }
    }

    return {
      totalEvaluationsCount: evaluations.length,
      successfulEvaluationsCount: successfulCount,
      failedEvaluationsCount: failedCount,
      currentConfidenceLevel: currentConfidence,
      averageAchievementRatePercent: avgAchievement,
      recentEvaluations: recent,
      primaryLearnings: Array.from(new Set(primaryLearnings)).slice(0, 5)
    };
  }

  /**
   * Limpa o estado (para uso em testes automatizados).
   */
  public clear(): void {
    this.evaluationsStore.clear();
    this.calibrationStore.clear();
  }
}

export const strategicImpactEvaluator = new StrategicImpactEvaluator();
