import { OperationalKPIsSnapshot } from './planningTypes.ts';

export interface StrategicOpportunityItem {
  opportunityId: string;
  title: string;
  description: string;
  potentialRevenueImpact: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedTemplateId: string;
}

export class StrategicOpportunityEngine {
  /**
   * Identifica janelas de oportunidades de mercado e otimização comercial baseadas nos KPIs operacionais.
   */
  public detectOpportunities(snapshot: OperationalKPIsSnapshot): StrategicOpportunityItem[] {
    const opps: StrategicOpportunityItem[] = [];

    // Oportunidade 1: Reativação e Recuperação de Propostas Canceladas
    if (snapshot.cancelledProposalsCount > 0) {
      const estimatedValue = snapshot.cancelledProposalsCount * 2500;
      opps.push({
        opportunityId: `opp_rec_prop_${snapshot.propertyId}_${Date.now()}`,
        title: 'Recuperação Ativa de Propostas de Alto Valor em Aberto',
        description: `Identificadas ${snapshot.cancelledProposalsCount} solicitações não concluídas no CRM. Ação direcionada pode reaver receita estimada de R$ ${estimatedValue.toLocaleString('pt-BR')}.`,
        potentialRevenueImpact: estimatedValue,
        urgency: snapshot.cancelledProposalsCount >= 5 ? 'HIGH' : 'MEDIUM',
        recommendedTemplateId: 'goal_direct_proposal_recovery'
      });
    }

    // Oportunidade 2: Otimização de ADR / Yield Management se Ocupação for Alta
    if (snapshot.occupancyRatePercent >= 75) {
      const potentialAddOn = snapshot.adr * 0.12 * 30 * 15; // Ganho estimado de margem com +12% de ADR
      opps.push({
        opportunityId: `opp_yield_${snapshot.propertyId}_${Date.now()}`,
        title: 'Alavancagem de Tarifas e Maximização de RevPAR via Yield Dynamic Pricing',
        description: `Com ocupação saudável (${snapshot.occupancyRatePercent}%), há margem para ajuste de ADR (+8% a +15%) nos inventários remanescentes.`,
        potentialRevenueImpact: Math.round(potentialAddOn),
        urgency: 'HIGH',
        recommendedTemplateId: 'goal_revenue_adr_optimization'
      });
    }

    // Oportunidade 3: Aceleração da Ocupação na Baixa Temporada / Dias Utéis
    if (snapshot.occupancyRatePercent < 60) {
      const revenueGain = (65 - snapshot.occupancyRatePercent) * snapshot.adr * 10;
      opps.push({
        opportunityId: `opp_occ_boost_${snapshot.propertyId}_${Date.now()}`,
        title: 'Campanha de Estímulo à Ocupação com Foco em Reservas Diretas',
        description: `Discrepância de ocupação (${snapshot.occupancyRatePercent}%). Estratégia de pacotes e diárias estendidas pode capturar demanda reprimida.`,
        potentialRevenueImpact: Math.round(revenueGain),
        urgency: 'HIGH',
        recommendedTemplateId: 'goal_occupancy_boost'
      });
    }

    // Oportunidade 4: Otimização Operacional do SLA da Governança
    if (snapshot.housekeepingSlaPercent < 85) {
      opps.push({
        opportunityId: `opp_hk_${snapshot.propertyId}_${Date.now()}`,
        title: 'Reestruturação de Roteamento Inteligente do Housekeeping',
        description: `Ajuste nas sequências de higienização eleva o SLA de ${snapshot.housekeepingSlaPercent}% para a meta de 95%, reduzindo filas de espera na recepção.`,
        potentialRevenueImpact: 5000,
        urgency: 'MEDIUM',
        recommendedTemplateId: 'goal_housekeeping_sla_optimization'
      });
    }

    return opps;
  }
}

export const strategicOpportunityEngine = new StrategicOpportunityEngine();
