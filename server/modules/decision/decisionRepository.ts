import { executiveCopilotService } from '../executiveCopilot/executiveCopilotService.ts';
import { executiveService } from '../executive/executiveService.ts';
import { revenueService } from '../revenue/revenueService.ts';
import { marketingService } from '../marketing/marketingService.ts';
import { salesService } from '../sales/salesService.ts';
import { directBookingService } from '../directBooking/directBookingService.ts';
import { receptionService } from '../reception/receptionService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { maintenanceService } from '../maintenance/maintenanceService.ts';
import { reservationService } from '../pms/reservationService.ts';
import { 
  DecisionDashboard, 
  DecisionRecommendation 
} from './decisionTypes.ts';

export class DecisionRepository {
  /**
   * Consolida diagnósticos e gera a Fila de Ações e Recomendações (100% READ-ONLY)
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<DecisionDashboard> {
    const [
      copilotDash,
      execDash,
      revenueDash,
      marketingDash,
      salesDash,
      directBookingDash,
      receptionDash,
      housekeepingDash,
      maintenanceDash,
      reservations
    ] = await Promise.all([
      executiveCopilotService.getDashboard(organizationId, propertyId),
      executiveService.getDashboard(organizationId, propertyId),
      revenueService.getDashboard(organizationId, propertyId),
      marketingService.getDashboard(organizationId, propertyId),
      salesService.getDashboard(organizationId, propertyId),
      directBookingService.getDashboard(organizationId, propertyId),
      receptionService.getDashboardData(organizationId, propertyId),
      housekeepingService.getDashboardSummary(organizationId, propertyId),
      maintenanceService.getDashboardSummary(organizationId, propertyId),
      reservationService.listReservations(organizationId, propertyId)
    ]);

    const now = new Date().toISOString();
    const recommendations: DecisionRecommendation[] = [];

    // --- 1. Recomendações de Manutenção Crítica ---
    const criticalMaint = maintenanceDash?.criticalTasksCount || 0;
    if (criticalMaint > 0) {
      recommendations.push({
        recommendationId: 'rec_maint_critical_01',
        title: 'Desbloqueio Imediato de Unidades Interditadas por Manutenção',
        description: `Priorizar o atendimento das ${criticalMaint} ordens de manutenção crítica registradas para devolver unidades ao inventário vendável.`,
        reason: 'Unidades fora de serviço geram perda direta de RevPAR e insatisfação no check-in.',
        sourceModule: 'maintenance',
        priority: 'critical',
        impact: 'high',
        risk: 'high',
        confidence: 95,
        estimatedBenefit: 'Desbloqueio de até 100% das UH para venda no final de semana',
        estimatedEffort: '2 a 4 horas de equipe de engenharia',
        recommendedOwner: 'Supervisor de Manutenção / Engenharia',
        dependencies: ['Estoque de peças de reposição'],
        approvalRequired: true,
        status: 'pending_approval',
        createdAt: now
      });
    }

    // --- 2. Recomendações de Governança ---
    const urgentHk = housekeepingDash?.urgentTasksCount || 0;
    if (urgentHk > 0) {
      recommendations.push({
        recommendationId: 'rec_hk_urgent_01',
        title: 'Prancha Expressa de Governança para Próximos Check-ins',
        description: `Redirecionar governantes para a limpeza prioritária das ${urgentHk} unidades com liberação pendente para o turno da tarde.`,
        reason: 'Evitar fila na recepção e atrasos na entrega de apartamentos no check-in.',
        sourceModule: 'housekeeping',
        priority: 'high',
        impact: 'high',
        risk: 'medium',
        confidence: 90,
        estimatedBenefit: 'Zero fila de espera por quarto no check-in das 14h',
        estimatedEffort: 'Remanejamento da equipe de turno',
        recommendedOwner: 'Governança Executiva',
        dependencies: ['Inspeção de governança aprovada'],
        approvalRequired: true,
        status: 'pending_approval',
        createdAt: now
      });
    }

    // --- 3. Recomendações de Venda Direta ---
    const dbOpenProposals = directBookingDash?.summary?.openProposalsCount || 0;
    const dbPotentialRevenue = directBookingDash?.summary?.totalPotentialRevenueOpen || 0;
    if (dbOpenProposals > 0) {
      recommendations.push({
        recommendationId: 'rec_db_followup_01',
        title: 'Ativação e Follow-up de Cotações Diretas em Aberto',
        description: `Realizar abordagem executiva personalizada via WhatsApp para as ${dbOpenProposals} cotações ativas totalizando R$ ${dbPotentialRevenue.toLocaleString('pt-BR')}.`,
        reason: 'Cotações diretas possuem margem líquida superior por isenção de comissão de OTAs.',
        sourceModule: 'direct_booking',
        priority: 'high',
        impact: 'high',
        risk: 'low',
        confidence: 88,
        estimatedBenefit: `Conversão estimada de até R$ ${(dbPotentialRevenue * 0.35).toLocaleString('pt-BR')} em receita direta`,
        estimatedEffort: '1 hora de agente de reservas diretas',
        recommendedOwner: 'Equipe de Reservas Diretas',
        dependencies: ['Modelo de mensagem executiva'],
        approvalRequired: true,
        status: 'pending_approval',
        createdAt: now
      });
    }

    // --- 4. Recomendações de Revenue Management ---
    const occupancy = revenueDash?.summary?.occupancyTodayPercent || 0;
    if (occupancy < 50) {
      recommendations.push({
        recommendationId: 'rec_rev_occupancy_boost_01',
        title: 'Lançamento de Oferta Estratégica para Hóspedes Frequentes',
        description: `Disparar campanha direcionada para o segmento VIP/Recorrente cadastrado no CRM para preenchimento de inventário ocioso.`,
        reason: `Ocupação projetada em ${occupancy}%, necessitando de tração de curto prazo.`,
        sourceModule: 'revenue',
        priority: 'medium',
        impact: 'high',
        risk: 'low',
        confidence: 85,
        estimatedBenefit: 'Elevação da taxa de ocupação em 10% a 15%',
        estimatedEffort: 'Criação e envio de campanha no CRM',
        recommendedOwner: 'Revenue Manager / Marketing',
        dependencies: ['Aprovação da tarifa promocional'],
        approvalRequired: true,
        status: 'pending_approval',
        createdAt: now
      });
    }

    // --- 5. Recomendações de Vendas Comerciais (B2B/Eventos) ---
    const openOpps = salesDash?.summary?.totalOpportunities || 0;
    const pipelineValue = salesDash?.summary?.totalPipelineValue || 0;
    if (openOpps > 0) {
      recommendations.push({
        recommendationId: 'rec_sales_pipeline_close_01',
        title: 'Aceleração de Oportunidades Comerciais em Estágio Avançado',
        description: `Revisar negociações B2B/Corporativas no valor de R$ ${pipelineValue.toLocaleString('pt-BR')} com probabilidade superior a 60%.`,
        reason: 'Garantir receita corporativa previsível para os próximos meses.',
        sourceModule: 'sales',
        priority: 'medium',
        impact: 'medium',
        risk: 'low',
        confidence: 82,
        estimatedBenefit: 'Fechamento de propostas acumuladas',
        estimatedEffort: 'Reunião de alinhamento com clientes corporativos',
        recommendedOwner: 'Gerente Comercial',
        dependencies: ['Contrato padrão aprovado pelo jurídico'],
        approvalRequired: true,
        status: 'pending_approval',
        createdAt: now
      });
    }

    // --- 6. Recomendações Estratégicas do Executive Copilot ---
    recommendations.push({
      recommendationId: 'rec_exec_copilot_strategic_01',
      title: 'Consolidação de Governança e Experiência do Hóspede (Executive Health)',
      description: `Manter alinhamento entre recepção, governança e manutenção para sustentar o Executive Health Score em ${copilotDash.healthScores.overallScore}/100.`,
      reason: 'A sinergia entre setores garante notas elevadas de reputação e fidelização de clientes.',
      sourceModule: 'executive_copilot',
      priority: 'low',
      impact: 'medium',
      risk: 'low',
      confidence: 90,
      estimatedBenefit: 'Manutenção de padrões de excelência internacional',
      estimatedEffort: 'Reunião diária de alinhamento de 15 minutos',
      recommendedOwner: 'Gerente Geral / Diretoria',
      dependencies: ['Dashboard do Executive Copilot'],
      approvalRequired: true,
      status: 'pending_approval',
      createdAt: now
    });

    // Ordenação da Fila de Ações por Prioridade (critical > high > medium > low)
    const priorityOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const totalPending = recommendations.length;
    const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
    const confidenceSum = recommendations.reduce((sum, r) => sum + r.confidence, 0);
    const confidenceAvg = totalPending > 0 ? Math.round(confidenceSum / totalPending) : 100;
    const highestPriorityAction = recommendations[0]?.title || 'Todas as ações operacionais estão em dia';

    // Divisão por categorias
    const categorized = {
      strategic: recommendations.filter(r => r.sourceModule === 'executive_copilot' || r.sourceModule === 'executive'),
      operational: recommendations.filter(r => r.sourceModule === 'reception' || r.sourceModule === 'pms'),
      commercial: recommendations.filter(r => r.sourceModule === 'sales' || r.sourceModule === 'revenue' || r.sourceModule === 'direct_booking'),
      marketing: recommendations.filter(r => r.sourceModule === 'marketing'),
      housekeeping: recommendations.filter(r => r.sourceModule === 'housekeeping'),
      maintenance: recommendations.filter(r => r.sourceModule === 'maintenance')
    };

    const dailyPriorities = recommendations.slice(0, 3).map(r => `[${r.priority.toUpperCase()}] ${r.title}`);
    const criticalBottlenecks = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').map(r => r.description);
    const quickWins = recommendations.filter(r => r.risk === 'low' && (r.priority === 'high' || r.priority === 'medium'));

    return {
      totalPendingRecommendations: totalPending,
      criticalRecommendationsCount: criticalCount,
      confidenceAverage: confidenceAvg,
      highestPriorityAction,
      executiveActionQueue: recommendations,
      dailyPriorities,
      criticalBottlenecks,
      quickWins,
      categorizedRecommendations: categorized,
      calculatedAt: now
    };
  }
}

export const decisionRepository = new DecisionRepository();
