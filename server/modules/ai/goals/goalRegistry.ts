import { GoalDefinition, StrategicGoal } from './goalTypes.ts';

export const PREDEFINED_GOAL_TEMPLATES: GoalDefinition[] = [
  {
    goalId: 'goal_occupancy_boost',
    title: 'Elevação da Ocupação na Baixa Temporada',
    objective: 'Aumentar a taxa de ocupação em 15% nos próximos 30 dias com estratégias combinadas de Revenue, Reservas Diretas e Marketing.',
    metrics: [
      { kpiId: 'kpi_occ_rate', name: 'Taxa de Ocupação', targetValue: 75, currentValue: 60, unit: '%' },
      { kpiId: 'kpi_revpar', name: 'RevPAR', targetValue: 250, currentValue: 210, unit: 'R$' }
    ],
    deadlineDays: 30,
    priority: 'HIGH',
    relatedKPIs: ['OccupancyRate', 'RevPAR', 'ADR', 'DirectBookings'],
    involvedAgents: ['revenue_agent', 'direct_booking_agent', 'marketing_agent', 'sales_agent'],
    dependencies: [],
    successCriteria: [
      'Taxa de ocupação atingir no mínimo 75%',
      'Crescimento de pelo menos 20% nas cotações de reservas diretas',
      'Manutenção ou aumento da diária média (ADR)'
    ],
    failureCriteria: [
      'Queda do RevPAR em mais de 5%',
      'Taxa de ocupação abaixo de 55% após 15 dias de execução'
    ],
    risks: [
      {
        riskId: 'risk_adr_dilution',
        description: 'Risco de diluição demasiada da tarifa diária em busca de volume',
        impact: 'HIGH',
        mitigationPlan: 'Monitoramento contínuo pelo revenue_agent travando descontos acima de 15%'
      }
    ],
    rollbackPlan: {
      steps: [
        'Restabelecer a grade tarifária padrão',
        'Pausar disparos de e-mail marketing ativos',
        'Notificar o gestor comercial para revisão manual'
      ],
      triggerConditions: ['Queda do RevPAR > 5%', 'Falta de aprovação das ofertas pelo gestor'],
      automated: false
    }
  },
  {
    goalId: 'goal_housekeeping_sla_optimization',
    title: 'Otimização do SLA de Higienização e Liberação de UHs',
    objective: 'Reduzir o tempo médio de liberação das acomodações no check-in de 45 min para 25 min com colaboração entre Governança e Recepção.',
    metrics: [
      { kpiId: 'kpi_hk_sla', name: 'Tempo Médio de Liberação de UH', targetValue: 25, currentValue: 45, unit: 'min' }
    ],
    deadlineDays: 14,
    priority: 'HIGH',
    relatedKPIs: ['CleaningSLA', 'CheckInWaitTime', 'GuestSatisfaction'],
    involvedAgents: ['housekeeping_agent', 'reception_agent', 'maintenance_agent', 'execution_agent'],
    dependencies: [],
    successCriteria: [
      'SLA médio de higienização igual ou inferior a 25 minutos',
      'Zero reclamações de atraso de check-in na recepção'
    ],
    failureCriteria: [
      'Aumento do backlog de UHs sujas acima de 10 acomodações em horário de pico'
    ],
    risks: [
      {
        riskId: 'risk_cleaning_quality',
        description: 'Qualidade da higienização comprometida pela pressa',
        impact: 'MEDIUM',
        mitigationPlan: 'Vistoria obrigatória do líder de governança antes da liberação final'
      }
    ],
    rollbackPlan: {
      steps: ['Retornar ao fluxo sequencial padrão de higienização', 'Realocar camareiras para apoio emergencial'],
      triggerConditions: ['Múltiplos apontamentos de falhas de qualidade na vistoria'],
      automated: false
    }
  },
  {
    goalId: 'goal_direct_proposal_recovery',
    title: 'Recuperação de Propostas Comerciais de Venda Direta Expiradas',
    objective: 'Reengajar 100% dos leads com propostas expiradas nos últimos 14 dias aumentando a conversão direta em 10%.',
    metrics: [
      { kpiId: 'kpi_direct_recovery_rate', name: 'Taxa de Conversão Direta', targetValue: 22, currentValue: 12, unit: '%' }
    ],
    deadlineDays: 7,
    priority: 'MEDIUM',
    relatedKPIs: ['ProposalConversion', 'DirectRevenue', 'LeadResponseTime'],
    involvedAgents: ['direct_booking_agent', 'sales_agent', 'approval_agent'],
    dependencies: [],
    successCriteria: [
      '100% das propostas expiradas reengajadas com mensagem personalizada',
      'Conversão direta atingir pelo menos 22%'
    ],
    failureCriteria: [
      'Taxa de opt-out/cancelamento de contato pelos leads superior a 5%'
    ],
    risks: [
      {
        riskId: 'risk_spam',
        description: 'Sensação de insistência/spam por parte dos potenciais hóspedes',
        impact: 'LOW',
        mitigationPlan: 'Limitar contato a no máximo 1 follow-up humanizado e aprovado antes do disparo'
      }
    ],
    rollbackPlan: {
      steps: ['Interromper a fila de follow-ups automáticos', 'Registrar motivo de opt-out no CRM'],
      triggerConditions: ['Opt-out > 5%'],
      automated: true
    }
  }
];

export class GoalRegistry {
  private goalsStore: Map<string, StrategicGoal> = new Map();
  private templatesStore: Map<string, GoalDefinition> = new Map();

  constructor() {
    for (const tmpl of PREDEFINED_GOAL_TEMPLATES) {
      this.templatesStore.set(tmpl.goalId, tmpl);
    }
  }

  public registerTemplate(template: GoalDefinition): void {
    this.templatesStore.set(template.goalId, template);
  }

  public getTemplate(goalId: string): GoalDefinition | null {
    return this.templatesStore.get(goalId) || null;
  }

  public getAllTemplates(): GoalDefinition[] {
    return Array.from(this.templatesStore.values());
  }

  public saveGoal(goal: StrategicGoal): void {
    this.goalsStore.set(goal.goalId, goal);
  }

  public getGoal(goalId: string): StrategicGoal | null {
    return this.goalsStore.get(goalId) || null;
  }

  public listGoals(filter?: { organizationId?: string; propertyId?: string; status?: string }): StrategicGoal[] {
    let result = Array.from(this.goalsStore.values());
    if (filter) {
      if (filter.organizationId) {
        result = result.filter(g => g.organizationId === filter.organizationId);
      }
      if (filter.propertyId) {
        result = result.filter(g => g.propertyId === filter.propertyId);
      }
      if (filter.status) {
        result = result.filter(g => g.status === filter.status);
      }
    }
    return result;
  }

  public clear(): void {
    this.goalsStore.clear();
  }
}

export const goalRegistry = new GoalRegistry();
