import { revenueService } from '../revenue/revenueService.ts';
import { marketingService } from '../marketing/marketingService.ts';
import { salesService } from '../sales/salesService.ts';
import { directBookingService } from '../directBooking/directBookingService.ts';
import { receptionService } from '../reception/receptionService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { maintenanceService } from '../maintenance/maintenanceService.ts';
import { reservationService } from '../pms/reservationService.ts';
import { guestRepository } from '../crm/guestRepository.ts';
import { strategicPlanningEngine } from '../ai/planning/strategicPlanningEngine.ts';
import { approvalRepository } from '../approval/approvalRepository.ts';
import { goalEngine } from '../ai/goals/goalEngine.ts';
import { 
  ExecutiveDashboard, 
  ExecutiveKpis, 
  ExecutiveAlert, 
  ExecutivePriorities, 
  ExecutiveSummaryModule 
} from './executiveTypes.ts';

export class ExecutiveRepository {
  /**
   * Consolida métricas READ-ONLY de todos os subsistemas em um dashboard executivo
   */
  async getDashboardData(organizationId: string, propertyId: string): Promise<ExecutiveDashboard> {
    const [
      revenueDash,
      marketingDash,
      salesDash,
      directBookingDash,
      receptionDash,
      housekeepingDash,
      maintenanceDash,
      reservations,
      guests,
      pendingApprovals
    ] = await Promise.all([
      revenueService.getDashboard(organizationId, propertyId),
      marketingService.getDashboard(organizationId, propertyId),
      salesService.getDashboard(organizationId, propertyId),
      directBookingService.getDashboard(organizationId, propertyId),
      receptionService.getDashboardData(organizationId, propertyId),
      housekeepingService.getDashboardSummary(organizationId, propertyId),
      maintenanceService.getDashboardSummary(organizationId, propertyId),
      reservationService.listReservations(organizationId, propertyId),
      guestRepository.listByOrganization(organizationId),
      approvalRepository.getPendingApprovals(organizationId, propertyId).catch(() => [])
    ]);

    const activeStrategicPlan = strategicPlanningEngine.getActivePlan(organizationId, propertyId);
    const activeGoals = goalEngine.listGoals({ organizationId, propertyId }).filter(
      g => ['CREATED', 'PLANNED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'VALIDATING'].includes(g.status)
    );

    // VIPs Chegando Hoje
    const todayStr = new Date().toISOString().split('T')[0];
    const todayArrivals = (reservations || []).filter(r => r.stayPeriod?.checkInDate === todayStr);
    const vipsTodayCount = (guests || []).filter(g => {
      const isVip = g.classification === 'vip' || g.tags?.includes('vip') || (g.totalSpentAmount || 0) > 5000;
      return isVip && todayArrivals.some(a => a.guest?.guestId === g.guestId);
    }).length;

    // 1. KPIs Consolidados
    const revSummary = revenueDash?.summary || {} as any;
    const salesSummary = salesDash?.summary || {} as any;
    const dbSummary = directBookingDash?.summary || {} as any;
    const recSummary = receptionDash?.summary || {} as any;
    const hkSummary = housekeepingDash || {} as any;
    const maintSummary = maintenanceDash || {} as any;
    const mktRetention = marketingDash?.retention || {} as any;
    const mktChannels = marketingDash?.channels || [];

    const kpis: ExecutiveKpis = {
      revenue: {
        totalRevenue: revSummary.totalRevenue || 0,
        adr: revSummary.adr || 0,
        revpar: revSummary.revPar || 0,
        occupancyRatePercent: revSummary.occupancyTodayPercent || 0,
        pickupCount: revSummary.pickupLast7Days?.reservationsCaptured || 0,
        bookingPacePercent: revSummary.bookingPace?.paceVsPreviousMonthPercent || 0
      },
      commercial: {
        pipelineValue: salesSummary.pipelineValue || 0,
        openOpportunitiesCount: salesSummary.openOpportunitiesCount || 0,
        proposalsCount: dbSummary.totalProposals || 0,
        conversionRatePercent: salesSummary.winRatePercent || 0
      },
      retentionAndMarketing: {
        retentionRatePercent: mktRetention.retentionRatePercent || 0,
        repeatGuestRatioPercent: mktRetention.repeatGuestRatioPercent || 0,
        averageLtv: mktRetention.averageEstimatedLtv || 0,
        topPerformingChannel: mktChannels.length > 0 ? mktChannels[0].channel : 'WhatsApp Direct'
      },
      operations: {
        pendingCheckInsCount: recSummary.checkinsExpectedToday || 0,
        pendingCheckOutsCount: recSummary.checkoutsExpectedToday || 0,
        inHouseCount: recSummary.guestsInHouse || 0,
        pendingCleaningsCount: hkSummary.pendingTasksCount || 0,
        urgentCleaningsCount: hkSummary.urgentTasksCount || 0,
        pendingMaintenanceCount: maintSummary.openTasksCount || 0,
        criticalMaintenanceCount: maintSummary.criticalTasksCount || 0
      }
    };

    // 2. Executive Alerts (Consolidação de Alertas Operacionais e Estratégicos)
    const alerts: ExecutiveAlert[] = [];

    // Alertas de Governança Estratégica (ADR-005)
    for (const pending of pendingApprovals) {
      alerts.push({
        alertId: `exec_pending_${pending.recommendationId}`,
        category: 'quality',
        severity: pending.priority === 'critical' ? 'critical' : 'high',
        title: `Decisão Estratégica Pendente (ADR-005): ${pending.title}`,
        description: `${pending.description} | ${pending.comments || pending.reason || ''}`,
        recommendedAction: 'Acesse o Approval Center para aprovar ou rejeitar formalmente esta recomendação.'
      });
    }

    if (vipsTodayCount > 0) {
      alerts.push({
        alertId: 'exec_vip_arrival',
        category: 'quality',
        severity: 'high',
        title: `${vipsTodayCount} Hóspede(s) VIP Chegando Hoje`,
        description: `Há ${vipsTodayCount} hóspedes de perfil VIP com check-in agendado para a data de hoje.`,
        recommendedAction: 'Alinhar com a Recepção recepção prioritária e amenidades de boas-vindas.'
      });
    }

    if ((hkSummary.urgentTasksCount || 0) > 0) {
      alerts.push({
        alertId: 'exec_urgent_housekeeping',
        category: 'operational',
        severity: 'high',
        title: 'Higienizações Críticas Pendentes',
        description: `Existem ${hkSummary.urgentTasksCount} tarefas de governança marcadas como urgentes/atrasadas.`,
        recommendedAction: 'Priorizar liberação de unidades de checkout com chegada iminente.'
      });
    }

    if ((maintSummary.criticalTasksCount || 0) > 0) {
      alerts.push({
        alertId: 'exec_critical_maintenance',
        category: 'operational',
        severity: 'critical',
        title: 'Manutenções de Alta Gravidade em Aberto',
        description: `${maintSummary.criticalTasksCount} ordens de manutenção crítica precisam de intervenção imediata.`,
        recommendedAction: 'Redirecionar equipe de manutenção para desbloquear unidades interditadas.'
      });
    }

    if ((revSummary.occupancyTodayPercent || 0) < 50) {
      alerts.push({
        alertId: 'exec_low_occupancy',
        category: 'financial',
        severity: 'medium',
        title: 'Ocupação Abaixo da Meta Prevista',
        description: `Taxa de ocupação atual em ${revSummary.occupancyTodayPercent || 0}%, abaixo do patamar ideal de 65%.`,
        recommendedAction: 'Consultar módulo Direct Booking e Revenue para ações táticas de venda direta.'
      });
    }

    // 3. Executive Priorities
    const dailyPriorities: string[] = [];

    if (activeStrategicPlan) {
      dailyPriorities.push(`Plano Estratégico Ativo v${activeStrategicPlan.version}: ${activeStrategicPlan.title} (${activeStrategicPlan.recommendations.length} recomendação(ões)).`);
    }

    for (const g of activeGoals) {
      dailyPriorities.push(`Missão Executiva [${g.definition.title}]: Status '${g.status}', Progresso ${g.metrics?.progressPercent || 0}%.`);
    }

    dailyPriorities.push(
      `Concluir recepção dos ${recSummary.checkinsExpectedToday || 0} check-ins e ${recSummary.checkoutsExpectedToday || 0} check-outs do dia.`,
      `Garantir prancha de higienização limpa para as ${hkSummary.pendingTasksCount || 0} unidades da governança.`,
      `Acompanhar ${salesSummary.openOpportunitiesCount || 0} oportunidades no pipeline comercial (R$ ${(salesSummary.pipelineValue || 0).toLocaleString('pt-BR')}).`
    );

    const priorities: ExecutivePriorities = {
      dailyPriorities: dailyPriorities.slice(0, 5),
      operationalRisks: [
        `Manutenções críticas em aberto: ${maintSummary.criticalTasksCount || 0} item(ns).`,
        `Limpezas urgentes com risco de impactar check-in: ${hkSummary.urgentTasksCount || 0} unidade(s).`
      ],
      commercialOpportunities: [
        `Propostas comerciais em negociação ativa: ${dbSummary.openProposalsCount || 0} cotação(ões).`,
        `Valor em aberto em negociações diretas: R$ ${(dbSummary.totalPotentialRevenueOpen || 0).toLocaleString('pt-BR')}.`
      ],
      revenueOpportunities: [
        activeStrategicPlan?.simulation?.simulationSummary
          ? `Simulação Estratégica: ${activeStrategicPlan.simulation.simulationSummary}`
          : `Pickup das últimas 24h em ${revSummary.pickupLast7Days?.reservationsCaptured || 0} reserva(s).`,
        `RevPAR atual fixado em R$ ${(revSummary.revPar || 0).toFixed(2)} com ADR de R$ ${(revSummary.adr || 0).toFixed(2)}.`
      ],
      marketingOpportunities: [
        `Taxa de retenção em ${mktRetention.retentionRatePercent || 0}% com ${mktRetention.repeatGuestRatioPercent || 0}% de hóspedes recorrentes.`,
        `Canal com maior conversão de captação: ${kpis.retentionAndMarketing.topPerformingChannel}.`
      ]
    };

    // 4. Executive Summary
    const summary: ExecutiveSummaryModule = {
      operationalToday: `Operação em andamento com ${recSummary.guestsInHouse || 0} hóspedes hospedados e ocupação de ${revSummary.occupancyTodayPercent || 0}%.`,
      commercialSummary: `Pipeline com ${salesSummary.openOpportunitiesCount || 0} negociações e valor total acumulado de R$ ${(salesSummary.pipelineValue || 0).toLocaleString('pt-BR')}.`,
      financialAnalyticalSummary: activeStrategicPlan
        ? `Plano v${activeStrategicPlan.version} ativo: ${activeStrategicPlan.executiveSummary}`
        : `Receita total apurada de R$ ${(revSummary.totalRevenue || 0).toLocaleString('pt-BR')} com RevPAR de R$ ${(revSummary.revPar || 0).toFixed(2)}.`,
      receptionSummary: `${recSummary.checkinsExpectedToday || 0} chegadas e ${recSummary.checkoutsExpectedToday || 0} saídas pendentes para a recepção.`,
      housekeepingSummary: `${hkSummary.pendingTasksCount || 0} tarefas de governança em andamento.`,
      maintenanceSummary: `${maintSummary.completedTasksCount || 0} manutenções resolvidas e ${maintSummary.openTasksCount || 0} em atendimento.`,
      marketingSummary: `Segmento predominante: ${mktRetention.predominantProfile || 'Hóspede Geral'}. LTV estimado em R$ ${(mktRetention.averageEstimatedLtv || 0).toFixed(2)}.`,
      salesSummary: `Taxa de fechamento comercial em ${salesSummary.winRatePercent || 0}% com ticket médio de R$ ${(salesSummary.averageTicketValue || 0).toFixed(2)}.`
    };

    return {
      kpis,
      alerts,
      priorities,
      summary,
      generatedAt: new Date().toISOString()
    };
  }
}

export const executiveRepository = new ExecutiveRepository();

