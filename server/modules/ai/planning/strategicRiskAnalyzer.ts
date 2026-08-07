import { OperationalKPIsSnapshot, StrategicRiskItem } from './planningTypes.ts';

export class StrategicRiskAnalyzer {
  /**
   * Avalia a foto de KPIs e identifica riscos estratégicos iminentes.
   */
  public analyzeRisks(snapshot: OperationalKPIsSnapshot): StrategicRiskItem[] {
    const risks: StrategicRiskItem[] = [];
    const now = new Date().toISOString();

    // 1. Risco de Baixa Ocupação em relação à meta
    if (snapshot.occupancyRatePercent < 60) {
      risks.push({
        riskId: `risk_occ_${snapshot.propertyId}_${Date.now()}`,
        category: 'OCCUPANCY',
        description: `Taxa de Ocupação Crítica (${snapshot.occupancyRatePercent}%). Desempenho abaixo do limiar de rentabilidade (60%).`,
        severity: snapshot.occupancyRatePercent < 45 ? 'CRITICAL' : 'HIGH',
        evidences: [
          `Ocupação atual apurada: ${snapshot.occupancyRatePercent}%`,
          `Meta mínima de equilíbrio operacional: 60%`,
          `Gap apurado: ${(60 - snapshot.occupancyRatePercent).toFixed(1)}%`
        ],
        mitigationStrategy: 'Ativar missão de alavancagem de ocupação com campanhas direcionadas de reservas diretas e promoções segmentadas.'
      });
    }

    // 2. Risco de Propostas Comerciais Canceladas sem Recuperação
    if (snapshot.cancelledProposalsCount > 5) {
      risks.push({
        riskId: `risk_canc_${snapshot.propertyId}_${Date.now()}`,
        category: 'REVENUE',
        description: `Evolução atípica de Propostas Canceladas (${snapshot.cancelledProposalsCount} propostas em aberto).`,
        severity: snapshot.cancelledProposalsCount > 10 ? 'CRITICAL' : 'MEDIUM',
        evidences: [
          `Volume de propostas de grupos/eventos não convertidas: ${snapshot.cancelledProposalsCount}`,
          `Valor em risco estimado na esteira comercial: R$ ${(snapshot.cancelledProposalsCount * 1200).toLocaleString('pt-BR')}`
        ],
        mitigationStrategy: 'Disparar ações ativas de follow-up automatizado do CRM e ofertas personalizadas para reativação.'
      });
    }

    // 3. Risco de Gargalo de Governança / SLA de Limpeza
    if (snapshot.housekeepingSlaPercent < 85) {
      risks.push({
        riskId: `risk_hk_${snapshot.propertyId}_${Date.now()}`,
        category: 'OPERATIONAL',
        description: `Deterioração no SLA da Governança (${snapshot.housekeepingSlaPercent}% de unidades liberadas no prazo).`,
        severity: snapshot.housekeepingSlaPercent < 70 ? 'HIGH' : 'MEDIUM',
        evidences: [
          `Percentual de liberações dentro do SLA: ${snapshot.housekeepingSlaPercent}%`,
          `Nível de serviço esperado: 90%`
        ],
        mitigationStrategy: 'Reorganizar filas de priorização de higienização baseada nos horários previstos de Check-in.'
      });
    }

    // 4. Risco de Dependência Excessiva de OTAs (Baixa Participação Direta)
    if (snapshot.directBookingSharePercent < 30) {
      risks.push({
        riskId: `risk_ota_${snapshot.propertyId}_${Date.now()}`,
        category: 'FINANCIAL',
        description: `Erosão de Margem por Dependência de Canais de Terceiros (Share Direto: ${snapshot.directBookingSharePercent}%).`,
        severity: 'MEDIUM',
        evidences: [
          `Share de Venda Direta atual: ${snapshot.directBookingSharePercent}%`,
          `Custo médio de comissionamento de OTAs: 18%-22%`
        ],
        mitigationStrategy: 'Implementar benefícios exclusivos para canal direto (early check-in, tarifas de fidelidade).'
      });
    }

    return risks;
  }
}

export const strategicRiskAnalyzer = new StrategicRiskAnalyzer();
