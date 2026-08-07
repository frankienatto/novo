import { executiveService } from '../executive/executiveService.ts';
import { revenueService } from '../revenue/revenueService.ts';
import { marketingService } from '../marketing/marketingService.ts';
import { salesService } from '../sales/salesService.ts';
import { directBookingService } from '../directBooking/directBookingService.ts';
import { receptionService } from '../reception/receptionService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { maintenanceService } from '../maintenance/maintenanceService.ts';
import { reservationService } from '../pms/reservationService.ts';
import { guestRepository } from '../crm/guestRepository.ts';
import { 
  ExecutiveCopilotDashboard, 
  HealthScoreBreakdown, 
  ExecutiveRisk, 
  ExecutiveOpportunity, 
  ExecutiveDailyBrief 
} from './executiveCopilotTypes.ts';

export class ExecutiveCopilotRepository {
  /**
   * Calcula analiticamente scores, riscos e oportunidades estratégicas (100% READ-ONLY)
   */
  async getCopilotDashboard(organizationId: string, propertyId: string): Promise<ExecutiveCopilotDashboard> {
    const [
      execDash,
      revenueDash,
      marketingDash,
      salesDash,
      directBookingDash,
      receptionDash,
      housekeepingDash,
      maintenanceDash,
      reservations,
      guests
    ] = await Promise.all([
      executiveService.getDashboard(organizationId, propertyId),
      revenueService.getDashboard(organizationId, propertyId),
      marketingService.getDashboard(organizationId, propertyId),
      salesService.getDashboard(organizationId, propertyId),
      directBookingService.getDashboard(organizationId, propertyId),
      receptionService.getDashboardData(organizationId, propertyId),
      housekeepingService.getDashboardSummary(organizationId, propertyId),
      maintenanceService.getDashboardSummary(organizationId, propertyId),
      reservationService.listReservations(organizationId, propertyId),
      guestRepository.listByOrganization(organizationId)
    ]);

    const revSummary = revenueDash?.summary || {} as any;
    const salesSummary = salesDash?.summary || {} as any;
    const dbSummary = directBookingDash?.summary || {} as any;
    const recSummary = receptionDash?.summary || {} as any;
    const hkSummary = housekeepingDash || {} as any;
    const maintSummary = maintenanceDash || {} as any;
    const mktRetention = marketingDash?.retention || {} as any;

    // --- 1. Cálculo do Health Score Setorial (0-100) ---
    // Revenue Health
    const occupancy = revSummary.occupancyTodayPercent || 0;
    const revHealth = Math.min(100, Math.max(0, Math.round(occupancy * 1.1 + (revSummary.revPar > 100 ? 20 : 10))));

    // Sales & Commercial Health
    const winRate = salesSummary.winRatePercent || 0;
    const commHealth = Math.min(100, Math.max(0, Math.round(winRate * 1.2 + (salesSummary.openOpportunitiesCount > 0 ? 30 : 10))));

    // Marketing & Retention Health
    const retentionRate = mktRetention.retentionRatePercent || 0;
    const mktHealth = Math.min(100, Math.max(0, Math.round(retentionRate * 1.1 + 20)));

    // Housekeeping Health
    const urgentHk = hkSummary.urgentTasksCount || 0;
    const hkHealth = Math.max(0, Math.min(100, 100 - urgentHk * 15));

    // Maintenance Health
    const criticalMaint = maintSummary.criticalTasksCount || 0;
    const maintHealth = Math.max(0, Math.min(100, 100 - criticalMaint * 20));

    // Guest Experience & Operations Health
    const pendingCheckins = recSummary.checkinsExpectedToday || 0;
    const opsHealth = Math.min(100, Math.max(0, Math.round((hkHealth + maintHealth) / 2)));
    const guestExpHealth = Math.min(100, Math.max(0, Math.round((opsHealth + mktHealth) / 2)));

    // Overall Score
    const overallScore = Math.round(
      revHealth * 0.25 +
      commHealth * 0.20 +
      opsHealth * 0.20 +
      guestExpHealth * 0.15 +
      mktHealth * 0.20
    );

    const healthScores: HealthScoreBreakdown = {
      overallScore,
      revenueHealth: revHealth,
      commercialHealth: commHealth,
      marketingHealth: mktHealth,
      salesHealth: commHealth,
      operationalHealth: opsHealth,
      guestExperienceHealth: guestExpHealth,
      housekeepingHealth: hkHealth,
      maintenanceHealth: maintHealth
    };

    // --- 2. Calculation of Risk & Opportunity Scores ---
    const riskScore = Math.min(100, Math.max(0, Math.round((criticalMaint * 25) + (urgentHk * 15) + (occupancy < 50 ? 20 : 0))));
    const opportunityScore = Math.min(100, Math.max(0, Math.round((dbSummary.openProposalsCount * 10) + (salesSummary.openOpportunitiesCount * 5) + 30)));

    // --- 3. Top Riscos do Dia (Max 10) ---
    const topRisks: ExecutiveRisk[] = [];
    if (criticalMaint > 0) {
      topRisks.push({
        riskId: 'risk_critical_maint',
        category: 'maintenance',
        severity: 'critical',
        title: 'Manutenções Críticas em Unidades Habitacionais',
        description: `Existem ${criticalMaint} ordens de manutenção de gravidade crítica que impedem a comercialização normal do inventário.`,
        impactScore: 9,
        mitigationStrategy: 'Priorizar despacho imediato da equipe de engenharia/manutenção preventiva.'
      });
    }

    if (urgentHk > 0) {
      topRisks.push({
        riskId: 'risk_urgent_housekeeping',
        category: 'operational',
        severity: 'high',
        title: 'Gargalo em Higienização com Check-in Próximo',
        description: `${urgentHk} unidades com saída recente necessitam de higienização urgente antes do pico de chegadas.`,
        impactScore: 8,
        mitigationStrategy: 'Remanejar governança para prancha de limpeza expressa de unidades ocupáveis.'
      });
    }

    if (occupancy < 50) {
      topRisks.push({
        riskId: 'risk_low_occupancy',
        category: 'financial',
        severity: 'medium',
        title: 'Ocupação Diária Abaixo da Meta Crítica',
        description: `A ocupação atual está em ${occupancy}%, o que compromete o RevPAR projetado para o mês.`,
        impactScore: 7,
        mitigationStrategy: 'Lançar campanha relâmpago de vendas diretas para público recorrente cadastrado no CRM.'
      });
    }

    if (salesSummary.openOpportunitiesCount > 10 && winRate < 30) {
      topRisks.push({
        riskId: 'risk_low_conversion',
        category: 'commercial',
        severity: 'medium',
        title: 'Baixa Conversão no Pipeline Comercial',
        description: `Pipeline acumulado de R$ ${(salesSummary.pipelineValue || 0).toLocaleString('pt-BR')} apresenta taxa de fechamento de apenas ${winRate}%.`,
        impactScore: 6,
        mitigationStrategy: 'Revisar propostas em aberto e aplicar cadência de follow-up personalizado via WhatsApp.'
      });
    }

    // --- 4. Top Oportunidades do Dia (Max 10) ---
    const topOpportunities: ExecutiveOpportunity[] = [];
    if ((dbSummary.openProposalsCount || 0) > 0) {
      topOpportunities.push({
        opportunityId: 'opp_direct_booking_followup',
        category: 'direct_booking',
        title: 'Ativação de Cotações Diretas em Aberto',
        description: `Existem ${dbSummary.openProposalsCount} cotações diretas ativas acumulando R$ ${(dbSummary.totalPotentialRevenueOpen || 0).toLocaleString('pt-BR')} em receita potencial.`,
        potentialImpact: `Recuperação potencial de até R$ ${((dbSummary.totalPotentialRevenueOpen || 0) * 0.4).toLocaleString('pt-BR')} sem comissão de OTAs.`,
        actionableSteps: [
          'Filtrar cotações expirando nas próximas 24 horas.',
          'Enviar mensagem executiva com flexibilização de checkout ou benefício de restaurante.'
        ]
      });
    }

    if (mktRetention.repeatGuestRatioPercent > 20) {
      topOpportunities.push({
        opportunityId: 'opp_vip_upsell',
        category: 'upsell',
        title: 'Upsell e Experiência Personalizada para Hóspedes Recorrentes',
        description: `${mktRetention.repeatGuestRatioPercent}% da base de clientes é composta por hóspedes habituais com LTV de R$ ${(mktRetention.averageEstimatedLtv || 0).toFixed(2)}.`,
        potentialImpact: 'Aumento do TRevPAR através de serviços agregados de gastronomia e spa.',
        actionableSteps: [
          'Identificar VIPs in-house ou com chegada no dia.',
          'Oferecer upgrades de categoria e experiência de boas-vindas.'
        ]
      });
    }

    topOpportunities.push({
      opportunityId: 'opp_yield_management',
      category: 'revenue',
      title: 'Otimização Dinâmica de ADR por Categoria',
      description: `RevPAR em R$ ${(revSummary.revPar || 0).toFixed(2)} com ADR de R$ ${(revSummary.adr || 0).toFixed(2)}. Oportunidade de tarifação flutuante em períodos de alta procura.`,
      potentialImpact: 'Aumento direto na margem de contribuição líquida.',
      actionableSteps: [
        'Acompanhar ritmo de reservas (pickup) nas janelas de 7 a 14 dias.',
        'Ajustar restrições de estadia mínima em datas de pico.'
      ]
    });

    // --- 5. Prioridades e Recomendações Estratégicas ---
    const recommendedPriorities = [
      `Foco no desbloqueio operacional: resolver ${criticalMaint} manutenções críticas e ${urgentHk} limpezas urgentes.`,
      `Ação comercial direta: fechar ${dbSummary.openProposalsCount || 0} cotações diretas em negociação.`,
      `Garantir experiência de recepção dos ${pendingCheckins} check-ins previstos.`
    ];

    const operationalBottlenecks = [
      criticalMaint > 0 ? `${criticalMaint} unidade(s) interditada(s) por manutenção.` : 'Nenhum bloqueio crítico de manutenção.',
      urgentHk > 0 ? `Turno de governança sob pressão por ${urgentHk} limpezas urgentes.` : 'Governança operando no tempo padrão.'
    ];

    const strategicTrends = [
      `Pickup de reservas nas últimas 24h: ${revSummary.pickupLast7Days?.reservationsCaptured || 0} novas reservas.`,
      `Pace de reservas em relação ao mês anterior: ${revSummary.bookingPace?.paceVsPreviousMonthPercent || 0}%.`,
      `Taxa de retenção de clientes estabelecida em ${retentionRate}%.`
    ];

    const strategicRecommendations = [
      'Manter canal de venda direta WhatsApp como prioridade de conversão sem custos de distribuição.',
      'Reforçar plano de manutenção preventiva preventiva para diminuir indisponibilidade de unidades nos finais de semana.',
      'Incentivar programas de fidelidade e ofertas de reengajamento para hóspedes inativos com alto LTV.'
    ];

    // --- 6. Executive Daily Brief ---
    const dailyBrief: ExecutiveDailyBrief = {
      summary: `Propriedade operando com Health Score de ${overallScore}/100. Ocupação em ${occupancy}% e RevPAR em R$ ${(revSummary.revPar || 0).toFixed(2)}.`,
      primaryFocusArea: criticalMaint > 0 ? 'Desbloqueio Operacional & Manutenção' : (occupancy < 50 ? 'Conversão Comercial & Vendas Diretas' : 'Excelência no Atendimento & Experiência do Hóspede'),
      keyAlertCount: execDash.alerts.length,
      strategicTakeaway: `Foco do dia: focar no atendimento dos ${pendingCheckins} check-ins e na conversão do pipeline ativo de R$ ${(salesSummary.pipelineValue || 0).toLocaleString('pt-BR')}.`
    };

    return {
      healthScores,
      riskScore,
      opportunityScore,
      topRisks: topRisks.slice(0, 10),
      topOpportunities: topOpportunities.slice(0, 10),
      recommendedPriorities,
      operationalBottlenecks,
      strategicTrends,
      strategicRecommendations,
      dailyBrief,
      calculatedAt: new Date().toISOString()
    };
  }
}

export const executiveCopilotRepository = new ExecutiveCopilotRepository();
