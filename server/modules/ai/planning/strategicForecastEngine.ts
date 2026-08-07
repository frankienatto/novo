import { OperationalKPIsSnapshot, StrategicSimulationResult } from './planningTypes.ts';

export class StrategicForecastEngine {
  /**
   * Projeta tendências de receita e ocupação para os próximos 30 dias.
   */
  public generateForecast(snapshot: OperationalKPIsSnapshot) {
    const trend: 'UPWARD' | 'STABLE' | 'DOWNWARD' = 
      snapshot.occupancyRatePercent >= 70 ? 'UPWARD' :
      snapshot.occupancyRatePercent >= 50 ? 'STABLE' : 'DOWNWARD';

    const projectedOccupancy = trend === 'UPWARD' 
      ? Math.min(100, snapshot.occupancyRatePercent + 5)
      : trend === 'DOWNWARD'
      ? Math.max(20, snapshot.occupancyRatePercent - 4)
      : snapshot.occupancyRatePercent;

    const projectedRevPAR = Math.round(snapshot.revPar * (projectedOccupancy / (snapshot.occupancyRatePercent || 1)));

    return {
      thirtyDayRevPARProjection: projectedRevPAR,
      thirtyDayOccupancyProjection: projectedOccupancy,
      trend
    };
  }

  /**
   * Realiza a simulação quantitativa de impacto do plano estratégico (Strategic Simulation).
   */
  public simulatePlan(
    planId: string,
    snapshot: OperationalKPIsSnapshot,
    proposalActionTypes: string[]
  ): StrategicSimulationResult {
    let projectedRevPARChangePercent = 0;
    let projectedOccupancyChangePercent = 0;
    let projectedADRChangePercent = 0;

    if (proposalActionTypes.includes('CREATE_GOAL')) {
      if (snapshot.occupancyRatePercent < 60) {
        projectedOccupancyChangePercent += 12.5;
        projectedRevPARChangePercent += 14.0;
      } else {
        projectedADRChangePercent += 8.0;
        projectedRevPARChangePercent += 10.2;
      }
    }

    if (proposalActionTypes.includes('PAUSE_GOAL') || proposalActionTypes.includes('CANCEL_GOAL')) {
      // Reativação de eficiência
      projectedRevPARChangePercent += 3.5;
    }

    const confidenceScore = Number(
      (0.82 + (snapshot.occupancyRatePercent > 0 ? 0.08 : 0) + (snapshot.revPar > 0 ? 0.05 : 0)).toFixed(2)
    );

    const recommendedDecision: 'PROCEED_TO_APPROVAL' | 'REJECT_PLAN' | 'REVISE_PARAMETERS' = 
      confidenceScore >= 0.75 ? 'PROCEED_TO_APPROVAL' : 'REVISE_PARAMETERS';

    return {
      simulationId: `sim_${planId}_${Date.now()}`,
      planId,
      scenarioName: `Simulação de Impacto Estratégico em Redes e Inventários (${snapshot.propertyId})`,
      projectedRevPARChangePercent,
      projectedOccupancyChangePercent,
      projectedADRChangePercent,
      confidenceScore,
      recommendedDecision,
      simulationSummary: `Simulação quantitativa projeta incremento de +${projectedRevPARChangePercent}% no RevPAR e +${projectedOccupancyChangePercent}% na taxa de ocupação com nível de confiança de ${(confidenceScore * 100).toFixed(0)}%.`
    };
  }
}

export const strategicForecastEngine = new StrategicForecastEngine();
