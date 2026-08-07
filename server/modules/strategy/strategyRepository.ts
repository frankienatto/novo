import { executiveCopilotService } from '../executiveCopilot/executiveCopilotService.ts';
import { executiveService } from '../executive/executiveService.ts';
import { decisionService } from '../decision/decisionService.ts';
import { revenueService } from '../revenue/revenueService.ts';
import { marketingService } from '../marketing/marketingService.ts';
import { salesService } from '../sales/salesService.ts';
import { directBookingService } from '../directBooking/directBookingService.ts';
import { crmService } from '../crm/crmService.ts';
import { receptionService } from '../reception/receptionService.ts';
import { housekeepingService } from '../housekeeping/housekeepingService.ts';
import { maintenanceService } from '../maintenance/maintenanceService.ts';
import { reservationService } from '../pms/reservationService.ts';
import { 
  SimulationScenario, 
  SimulationParams, 
  StrategyDashboard, 
  ScenarioMetrics,
  ExplainableAiDetails
} from './strategyTypes.ts';

export class StrategyRepository {
  /**
   * Coleta dados atuais agregados das APIs públicas dos módulos oficiais.
   * Não acessa repositórios internos nem bancos de dados diretamente.
   */
  private async getBaselineMetrics(organizationId: string, propertyId: string): Promise<ScenarioMetrics> {
    const [
      revenueDash,
      salesDash,
      marketingDash,
      directBookingDash,
      housekeepingDash,
      maintenanceDash,
      crmMetrics
    ] = await Promise.all([
      revenueService.getDashboard(organizationId, propertyId).catch(() => null),
      salesService.getDashboard(organizationId, propertyId).catch(() => null),
      marketingService.getDashboard(organizationId, propertyId).catch(() => null),
      directBookingService.getDashboard(organizationId, propertyId).catch(() => null),
      housekeepingService.getDashboardSummary(organizationId, propertyId).catch(() => null),
      maintenanceService.getDashboardSummary(organizationId, propertyId).catch(() => null),
      crmService.getMetrics(organizationId).catch(() => null)
    ]);

    const adr = revenueDash?.kpis?.adr || 420;
    const occupancyRate = revenueDash?.kpis?.occupancyRate || 68;
    const revpar = revenueDash?.kpis?.revpar || Number((adr * (occupancyRate / 100)).toFixed(2));
    const monthlyRevenue = revenueDash?.kpis?.totalMonthlyRevenue || Math.round(revpar * 30 * 20);
    const conversionRate = salesDash?.summary?.conversionRatePercent || 22;
    const cancellationRate = revenueDash?.kpis?.cancellationRatePercent || 8.5;
    const directBookingShare = directBookingDash?.summary?.directSharePercent || 35;
    const avgHousekeepingTimeMinutes = housekeepingDash?.avgCleaningTimeMinutes || 35;
    const maintenanceBacklogCount = maintenanceDash?.totalTasksOpen || 5;
    const leadTimeDays = revenueDash?.kpis?.leadTimeDays || 18;
    const bookingPaceIndex = revenueDash?.kpis?.bookingPaceIndex || 102;

    return {
      adr,
      occupancyRate,
      revpar,
      monthlyRevenue,
      conversionRate,
      cancellationRate,
      directBookingShare,
      avgHousekeepingTimeMinutes,
      maintenanceBacklogCount,
      leadTimeDays,
      bookingPaceIndex,
      repeatGuestRate: crmMetrics?.frequentGuestsRate || 28
    };
  }

  /**
   * Gera os 10 cenários simulações ("What If") padrão com dados em memória.
   */
  async getScenarios(organizationId: string, propertyId: string): Promise<SimulationScenario[]> {
    const baseline = await this.getBaselineMetrics(organizationId, propertyId);
    const now = new Date().toISOString();

    const scenarios: SimulationScenario[] = [
      // 1. Aumento de ADR (+10%)
      this.createScenario({
        scenarioId: 'scen_adr_increase_01',
        type: 'adr_increase',
        title: 'Simulação de Otimização Tarifária (ADR +10%)',
        description: 'Avalia o impacto de um ajuste dinâmico de +10% na Diária Média (ADR) aplicando precificação seletiva em alta demanda.',
        baseline,
        projectedMutator: (b) => {
          const newAdr = Math.round(b.adr * 1.10);
          const newRevpar = Math.round(newAdr * (b.occupancyRate / 100));
          const newRevenue = Math.round(newRevpar * 30 * 20);
          return { ...b, adr: newAdr, revpar: newRevpar, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.10),
        confidence: 90,
        effortLevel: 'low',
        expectedSalesLiftPercent: 10,
        affectedModules: ['revenue', 'directBooking', 'pms'],
        reasoning: 'Otimizar o ADR em períodos de ocupação alta gera ganho direto na margem de contribuição sem aumentar custos operacionais fixos.',
        evidence: [
          `ADR atual consolidado do Revenue Intelligence: R$ ${baseline.adr}`,
          `Taxa de Ocupação consolidada: ${baseline.occupancyRate}%`,
          'Elasticidade de preço favorável nas diárias de final de semana.'
        ],
        assumptions: ['A demanda de finais de semana se mantém estável com sensibilidade ao preço baixa', 'Acomodações de categoria superior suportam o reposicionamento'],
        risks: ['Pequeno risco de sensibilidade de preço em dias úteis se aplicado indiscriminadamente'],
        benefits: ['Aumento direto de receita líquida e RevPAR', 'Valorização da percepção da marca e do produto hoteleiro'],
        limitations: ['Requer monitoramento diário da curva de conversão'],
        dependencies: ['Aprovação prévia da gerência de vendas e RM']
      }),

      // 2. Redução de Cancelamentos (-30%)
      this.createScenario({
        scenarioId: 'scen_cancellation_reduction_02',
        type: 'cancellation_reduction',
        title: 'Simulação de Proteção contra Cancelamentos (-30%)',
        description: 'Avalia a redução em 30% na taxa de cancelamentos por meio de política de pré-pagamento parcial e régua de relacionamento.',
        baseline,
        projectedMutator: (b) => {
          const newCancel = Number((b.cancellationRate * 0.70).toFixed(1));
          const newOccupancy = Math.min(100, Number((b.occupancyRate + 3.5).toFixed(1)));
          const newRevpar = Math.round(b.adr * (newOccupancy / 100));
          const newRevenue = Math.round(newRevpar * 30 * 20);
          return { ...b, cancellationRate: newCancel, occupancyRate: newOccupancy, revpar: newRevpar, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.05),
        confidence: 88,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 5,
        affectedModules: ['revenue', 'crm', 'reception'],
        reasoning: 'Garantir sinal e realizar lembretes proativos via WhatsApp e e-mail previne desistências de última hora e garante inventário faturado.',
        evidence: [
          `Taxa de cancelamento atual registrada: ${baseline.cancellationRate}%`,
          'Maior concentração de cancelamentos sem aviso prévio ocorrendo entre 48h e 24h antes do check-in.'
        ],
        assumptions: ['Engajamento do hóspede através de lembretes antes do check-in', 'Política de reembolso flexível com crédito para estadias futuras'],
        risks: ['Resistência pontual de hóspedes indecisos à cobrança de sinal'],
        benefits: ['Maior previsibilidade de receita e caixa', 'Menos buracos de última hora no mapa de ocupação'],
        limitations: ['Aplica-se predominantemente a tarifas promocionais e datas festivas'],
        dependencies: ['Ajuste do termo de reserva e régua do CRM']
      }),

      // 3. Aumento da Conversão Comercial (+15%)
      this.createScenario({
        scenarioId: 'scen_conversion_increase_03',
        type: 'conversion_increase',
        title: 'Simulação de Aceleração Comercial (+15% Conversão)',
        description: 'Simula o ganho de receita ao acelerar em 15% a conversão de propostas abertas no funil de Reservas Diretas e Sales CRM.',
        baseline,
        projectedMutator: (b) => {
          const newConv = Number((b.conversionRate * 1.15).toFixed(1));
          const newRevenue = Math.round(b.monthlyRevenue * 1.08);
          return { ...b, conversionRate: newConv, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.08),
        confidence: 92,
        effortLevel: 'low',
        expectedSalesLiftPercent: 8,
        affectedModules: ['sales', 'directBooking', 'crm'],
        reasoning: 'Follow-ups automatizados em menos de 2 horas para propostas acima de R$ 2.000 dobram as chances de fechamento.',
        evidence: [
          `Taxa de conversão comercial atual: ${baseline.conversionRate}%`,
          'Propostas pendentes no Direct Booking CRM somam valor significativo não convertido.'
        ],
        assumptions: ['Atendimento rápido de leads e cotações pelo canal direto', 'Utilização de gatilhos de urgência e cortesias exclusivas'],
        risks: ['Necessidade de rápido tempo de resposta da equipe de atendimento'],
        benefits: ['Redução do ciclo de venda comercial', 'Aumento imediato das reservas diretas negociadas'],
        limitations: ['Depende da agilidade do operador durante o horário de pico'],
        dependencies: ['Fila de prioridades do Sales CRM ativa']
      }),

      // 4. Aumento da Ocupação (+8%)
      this.createScenario({
        scenarioId: 'scen_occupancy_increase_04',
        type: 'occupancy_increase',
        title: 'Simulação de Ocupação Incremental (+8 pontos)',
        description: 'Mede o resultado financeiro de elevar a ocupação média em 8 pontos percentuais com estratégias de mid-week e pacotes diferenciados.',
        baseline,
        projectedMutator: (b) => {
          const newOccupancy = Math.min(100, Number((b.occupancyRate + 8).toFixed(1)));
          const newRevpar = Math.round(b.adr * (newOccupancy / 100));
          const newRevenue = Math.round(newRevpar * 30 * 20);
          return { ...b, occupancyRate: newOccupancy, revpar: newRevpar, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round((baseline.adr * 0.08 * 30 * 20)),
        confidence: 85,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 12,
        affectedModules: ['revenue', 'marketing', 'sales'],
        reasoning: 'Atrair público corporate e de eventos nos dias de menor demanda (terça e quarta) eleva a média semanal do hotel.',
        evidence: [
          `Ocupação atual média: ${baseline.occupancyRate}%`,
          'Ocupação de terça/quarta-feira com margem de crescimento de até 20%'
        ],
        assumptions: ['Parcerias corporativas e pacotes de coworking atrativos', 'Campanhas segmentadas de lazer estendido'],
        risks: ['Ligeiro aumento de custos variáveis com café da manhã e lavanderia'],
        benefits: ['Aproveitamento da capacidade ociosa durante a semana', 'Diluição de custos fixos operacionais'],
        limitations: ['Exige investimento pontual em divulgação comercial'],
        dependencies: ['Módulo Marketing e Parcerias Empresariais']
      }),

      // 5. Aumento da Retenção / Recorrência de Hóspedes (+20%)
      this.createScenario({
        scenarioId: 'scen_retention_increase_05',
        type: 'retention_increase',
        title: 'Simulação de Fidelização & LTV (+20% Recorrência)',
        description: 'Simula o impacto no Lifetime Value (LTV) e faturamento ao aumentar em 20% o retorno de hóspedes cadastrados no CRM.',
        baseline,
        projectedMutator: (b) => {
          const newRepeat = Number(((b.repeatGuestRate || 28) * 1.20).toFixed(1));
          const newRevenue = Math.round(b.monthlyRevenue * 1.06);
          return { ...b, repeatGuestRate: newRepeat, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.06),
        confidence: 91,
        effortLevel: 'low',
        expectedSalesLiftPercent: 6,
        affectedModules: ['crm', 'marketing', 'directBooking'],
        reasoning: 'Conquistar uma reserva recorrente custa 7x menos do que adquirir um novo hóspede via campanhas pagas.',
        evidence: [
          `Taxa atual de hóspedes frequentes no CRM: ${baseline.repeatGuestRate || 28}%`,
          'Hóspedes recorrentes apresentam ticket médio 18% maior e gastam mais no consumo do hotel.'
        ],
        assumptions: ['Oferta de cortesia VIP ou upgrade de boas-vindas na segunda estadia', 'Régua de comunicação pós-checkout automatizada'],
        risks: ['Risco nulo se mantido padrão de qualidade na hospedagem'],
        benefits: ['Custo de Aquisição de Clientes (CAC) praticamente zero', 'Aumento sustentável do LTV do hotel'],
        limitations: ['Depende da qualidade da experiência do hóspede durante a estadia'],
        dependencies: ['Banco de Hóspedes CRM e Guest Intelligence']
      }),

      // 6. Aumento das Reservas Diretas (+25% no Canal Direto)
      this.createScenario({
        scenarioId: 'scen_direct_booking_increase_06',
        type: 'direct_booking_increase',
        title: 'Simulação de Migração para Canal Direto (+25% Direta)',
        description: 'Avalia a economia com comissões de OTAs e aumento do faturamento líquido ao elevar a participação do Canal Direto.',
        baseline,
        projectedMutator: (b) => {
          const newShare = Math.min(100, Number((b.directBookingShare * 1.25).toFixed(1)));
          const commissionSavings = Math.round(b.monthlyRevenue * 0.04);
          const newRevenue = b.monthlyRevenue + commissionSavings;
          return { ...b, directBookingShare: newShare, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.04),
        confidence: 94,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 4,
        affectedModules: ['directBooking', 'marketing', 'revenue'],
        reasoning: 'Reduzir a dependência de OTAs que cobram entre 15% e 22% transfere margem diretamente para o resultado financeiro do hotel.',
        evidence: [
          `Participação atual do Canal Direto: ${baseline.directBookingShare}%`,
          'Custo médio estimado de comissão pago a OTAs: 18%'
        ],
        assumptions: ['Melhor Preço Garantido no site oficial e canal WhatsApp', 'Oferta de benefícios exclusivos (early check-in, drink de boas-vindas)'],
        risks: ['Paridade tarifária com OTAs deve ser gerenciada com cuidado'],
        benefits: ['Economia direta de comissões', 'Posse total do relacionamento e dados do hóspede'],
        limitations: ['OTAs continuam sendo canal importante de atração inicial (Efeito Vitrine)'],
        dependencies: ['Motor de Reservas e Canal de Vendas Diretas']
      }),

      // 7. Redução do Tempo de Limpeza de Governança (-20%)
      this.createScenario({
        scenarioId: 'scen_hk_time_reduction_07',
        type: 'housekeeping_time_reduction',
        title: 'Simulação de Eficiência Operacional de Governança (-20% Tempo)',
        description: 'Avalia o ganho de produtividade ao otimizar o tempo médio de limpeza por UH de 35 min para 28 min com listas padronizadas.',
        baseline,
        projectedMutator: (b) => {
          const newTime = Math.round(b.avgHousekeepingTimeMinutes * 0.80);
          return { ...b, avgHousekeepingTimeMinutes: newTime };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.02),
        confidence: 89,
        effortLevel: 'low',
        expectedSalesLiftPercent: 2,
        affectedModules: ['housekeeping', 'reception', 'pms'],
        reasoning: 'Liberar UHs com 20% mais rapidez reduz o tempo de espera do hóspede no lobby e possibilita early check-ins cobrados.',
        evidence: [
          `Tempo médio atual de governança por UH: ${baseline.avgHousekeepingTimeMinutes} minutos`,
          'Pico de demanda por quartos limpos entre 12h e 14h'
        ],
        assumptions: ['Adopção do app de governança pelas camareiras', 'Checklist digital e suprimento prévio de carrinhos'],
        risks: ['Não comprometer a qualidade do padrão de higienização do apartamento'],
        benefits: ['Agilidade na entrega de quartos no check-in', 'Maior capacidade operacional da equipe'],
        limitations: ['Depende do treinamento do time de governança'],
        dependencies: ['Módulo Governança e App Mobile']
      }),

      // 8. Redução de Backlog de Manutenção (-50%)
      this.createScenario({
        scenarioId: 'scen_maint_backlog_reduction_08',
        type: 'maintenance_backlog_reduction',
        title: 'Simulação de Desbloqueio por Manutenção Preventiva (-50% Backlog)',
        description: 'Calcula o faturamento resgatado ao reduzir em 50% o número de ordens abertas e unidades indisponíveis por reparos.',
        baseline,
        projectedMutator: (b) => {
          const newBacklog = Math.max(0, Math.round(b.maintenanceBacklogCount * 0.50));
          const newRevenue = Math.round(b.monthlyRevenue * 1.03);
          return { ...b, maintenanceBacklogCount: newBacklog, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.03),
        confidence: 93,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 3,
        affectedModules: ['maintenance', 'housekeeping', 'pms'],
        reasoning: 'Recuperar unidades bloqueadas por pequenas pendências (ar condicionado, lâmpadas, pintura) devolve capacidade vendável ao hotel.',
        evidence: [
          `Backlog atual de ordens de manutenção abertas: ${baseline.maintenanceBacklogCount} tarefas`,
          'UHs paradas representam perda invisível de receita diária'
        ],
        assumptions: ['Mutirão de manutenção em dias de menor ocupação', 'Estoque crítico de peças de reposição garantido'],
        risks: ['Custo imediato pontual com insumos de manutenção'],
        benefits: ['Aumento imediato do inventário vendável', 'Redução do risco de reclamações de hóspedes'],
        limitations: ['Depende da disponibilidade de insumos e técnicos'],
        dependencies: ['Módulo Manutenção Preventiva']
      }),

      // 9. Melhoria do Lead Time (+25% Antecedência)
      this.createScenario({
        scenarioId: 'scen_lead_time_improvement_09',
        type: 'lead_time_improvement',
        title: 'Simulação de Vendas Antecipadas (Lead Time +25%)',
        description: 'Simula o fortalecimento da antecedência média de reserva de 18 para 22 dias por meio de campanhas antecipadas e tarifas Early Bird.',
        baseline,
        projectedMutator: (b) => {
          const newLead = Math.round(b.leadTimeDays * 1.25);
          return { ...b, leadTimeDays: newLead };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.04),
        confidence: 87,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 4,
        affectedModules: ['revenue', 'marketing', 'sales'],
        reasoning: 'Garantir ocupação com maior antecedência dá segurança para elevar o valor das últimas diárias disponíveis no pico de demanda.',
        evidence: [
          `Lead Time médio atual acumulado: ${baseline.leadTimeDays} dias`,
          'Reservas efetuadas com mais de 20 dias de antecedência possuem menor índice de cancelamento'
        ],
        assumptions: ['Abertura do calendário com pelo menos 90 dias de antecedência', 'Tarifas motivadoras para reservas antecipadas não-reembolsáveis'],
        risks: ['Abertura de tarifas com valores defasados se o forecast não for revisado'],
        benefits: ['Caixa antecipado e previsibilidade de ocupação', 'Maior poder de precificação na véspera da data'],
        limitations: ['Depende do perfil de viagem do destino (lazer vs negócios)'],
        dependencies: ['Calendário do PMS e Estratégia de Revenue']
      }),

      // 10. Aceleração do Booking Pace (+15% no Pace de Captação)
      this.createScenario({
        scenarioId: 'scen_booking_pace_improvement_10',
        type: 'booking_pace_improvement',
        title: 'Simulação de Ritmo de Reservas (Booking Pace +15%)',
        description: 'Mede os ganhos decorrentes de acelerar em 15% a velocidade diária de entrada de novas reservas para os próximos 30/60/90 dias.',
        baseline,
        projectedMutator: (b) => {
          const newPace = Math.round(b.bookingPaceIndex * 1.15);
          const newRevenue = Math.round(b.monthlyRevenue * 1.05);
          return { ...b, bookingPaceIndex: newPace, monthlyRevenue: newRevenue };
        },
        financialMonthlyGain: Math.round(baseline.monthlyRevenue * 0.05),
        confidence: 90,
        effortLevel: 'medium',
        expectedSalesLiftPercent: 5,
        affectedModules: ['revenue', 'directBooking', 'marketing'],
        reasoning: 'Ritmo forte de captação permite fechar o inventário mais rápido e acionar gatilhos de tarifa máxima.',
        evidence: [
          `Índice atual de Booking Pace: ${baseline.bookingPaceIndex}`,
          'Evolução positiva da curva de reservas comparada ao mesmo período do ano anterior'
        ],
        assumptions: ['Campanhas de retargeting e presença contínua nos canais digitais', 'Agilidade no atendimento de cotações diretas'],
        risks: ['Vender rápido demais por valores abaixo do teto ótimo do mercado'],
        benefits: ['Garantia precoce da meta mensal de faturamento', 'Otimização do RevPAR global'],
        limitations: ['Exige acompanhamento diário do pickup'],
        dependencies: ['Dashboard de Revenue Intelligence']
      })
    ];

    return scenarios;
  }

  /**
   * Constrói um objeto SimulationScenario completo e com validação Explainable AI.
   */
  private createScenario(params: {
    scenarioId: string;
    type: any;
    title: string;
    description: string;
    baseline: ScenarioMetrics;
    projectedMutator: (b: ScenarioMetrics) => ScenarioMetrics;
    financialMonthlyGain: number;
    confidence: number;
    effortLevel: 'low' | 'medium' | 'high';
    expectedSalesLiftPercent: number;
    affectedModules: string[];
    reasoning: string;
    evidence: string[];
    assumptions: string[];
    risks: string[];
    benefits: string[];
    limitations: string[];
    dependencies: string[];
  }): SimulationScenario {
    const projectedScenario = params.projectedMutator(params.baseline);
    const annualGain = params.financialMonthlyGain * 12;
    const gainPercent = Number(((params.financialMonthlyGain / (params.baseline.monthlyRevenue || 1)) * 100).toFixed(1));

    const explainableAi: ExplainableAiDetails = {
      reasoning: params.reasoning,
      evidence: params.evidence,
      confidenceScore: params.confidence,
      estimatedGain: `+R$ ${params.financialMonthlyGain.toLocaleString('pt-BR')}/mês (+${gainPercent}%)`,
      estimatedRisk: params.effortLevel === 'high' ? 'high' : params.effortLevel === 'medium' ? 'medium' : 'low',
      businessImpact: `Incremento projetado de faturamento de R$ ${params.financialMonthlyGain.toLocaleString('pt-BR')}/mês`,
      operationalImpact: `Nível de esforço operacional: ${params.effortLevel.toUpperCase()}`,
      financialImpact: `Ganho estimado: R$ ${params.financialMonthlyGain.toLocaleString('pt-BR')}/mês (R$ ${annualGain.toLocaleString('pt-BR')}/ano)`,
      affectedModules: params.affectedModules,
      dependencies: params.dependencies,
      humanApprovalRequired: true,
      approvalRequired: true,
      status: 'simulation_only'
    };

    return {
      scenarioId: params.scenarioId,
      type: params.type,
      title: params.title,
      description: params.description,
      currentScenario: params.baseline,
      projectedScenario,
      financialImpact: {
        estimatedMonthlyGain: params.financialMonthlyGain,
        estimatedAnnualGain: annualGain,
        gainPercent,
        description: `Ganho estimado de R$ ${params.financialMonthlyGain.toLocaleString('pt-BR')} por mês`
      },
      operationalImpact: {
        description: `Requer nível de esforço ${params.effortLevel} para adequação das rotinas operacionais`,
        effortLevel: params.effortLevel,
        workloadChange: params.effortLevel === 'high' ? 'Reorganização moderada de processos' : 'Ajuste simples de rotina'
      },
      commercialImpact: {
        description: `Projeção de alavancagem comercial de +${params.expectedSalesLiftPercent}%`,
        expectedSalesLiftPercent: params.expectedSalesLiftPercent,
        channelImpact: 'Impacto positivo nos canais diretos e percepção de valor da propriedade'
      },
      confidence: params.confidence,
      assumptions: params.assumptions,
      risks: params.risks,
      benefits: params.benefits,
      limitations: params.limitations,
      dependencies: params.dependencies,
      explainableAi,
      humanApprovalRequired: true,
      approvalRequired: true,
      status: 'simulation_only',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Executa uma simulação customizada em memória a partir dos parâmetros informados.
   * Não altera nem grava nenhum dado no banco de dados.
   */
  async simulateCustomScenario(params: SimulationParams, organizationId: string, propertyId: string): Promise<SimulationScenario> {
    const baseline = await this.getBaselineMetrics(organizationId, propertyId);

    const adrFactor = 1 + ((params.adrIncreasePercent || 0) / 100);
    const cancelFactor = 1 - ((params.cancellationReductionPercent || 0) / 100);
    const convFactor = 1 + ((params.conversionIncreasePercent || 0) / 100);
    const occFactor = (params.occupancyIncreasePercent || 0);
    const directFactor = 1 + ((params.directBookingIncreasePercent || 0) / 100);
    const hkTimeFactor = 1 - ((params.housekeepingTimeReductionPercent || 0) / 100);
    const maintFactor = 1 - ((params.maintenanceBacklogReductionPercent || 0) / 100);

    const newAdr = Math.round(baseline.adr * adrFactor);
    const newOccupancy = Math.min(100, Number((baseline.occupancyRate + occFactor).toFixed(1)));
    const newRevpar = Math.round(newAdr * (newOccupancy / 100));
    const newCancellation = Number((baseline.cancellationRate * cancelFactor).toFixed(1));
    const newConversion = Number((baseline.conversionRate * convFactor).toFixed(1));
    const newDirectShare = Math.min(100, Number((baseline.directBookingShare * directFactor).toFixed(1)));
    const newHkTime = Math.round(baseline.avgHousekeepingTimeMinutes * hkTimeFactor);
    const newMaint = Math.max(0, Math.round(baseline.maintenanceBacklogCount * maintFactor));

    const newMonthlyRevenue = Math.round(newRevpar * 30 * 20 * (newConversion / (baseline.conversionRate || 1)));
    const monthlyGain = Math.max(0, newMonthlyRevenue - baseline.monthlyRevenue);

    const projectedScenario: ScenarioMetrics = {
      ...baseline,
      adr: newAdr,
      occupancyRate: newOccupancy,
      revpar: newRevpar,
      cancellationRate: newCancellation,
      conversionRate: newConversion,
      directBookingShare: newDirectShare,
      avgHousekeepingTimeMinutes: newHkTime,
      maintenanceBacklogCount: newMaint,
      monthlyRevenue: newMonthlyRevenue
    };

    const type = params.scenarioType || 'custom';
    const title = params.customName || `Simulação Personalizada (${type})`;

    return this.createScenario({
      scenarioId: `scen_custom_${Date.now()}`,
      type,
      title,
      description: 'Simulação interativa "What If" gerada sob demanda em memória.',
      baseline,
      projectedMutator: () => projectedScenario,
      financialMonthlyGain: monthlyGain || Math.round(baseline.monthlyRevenue * 0.05),
      confidence: 88,
      effortLevel: 'medium',
      expectedSalesLiftPercent: 8,
      affectedModules: ['revenue', 'sales', 'directBooking', 'housekeeping', 'maintenance'],
      reasoning: 'Simulação projetada em memória pela combinação customizada de premissas táticas e estratégicas.',
      evidence: [
        `Métricas consolidadas do hotel lidas em tempo real dos módulos oficiais`,
        `Faturamento atual estimado: R$ ${baseline.monthlyRevenue.toLocaleString('pt-BR')}`
      ],
      assumptions: ['Parâmetros informados pelo operador refletem a meta operacional planejada'],
      risks: ['Depende da execução consistente das equipes no dia a dia'],
      benefits: ['Visibilidade antecipada do impacto financeiro de decisões táticas'],
      limitations: ['Projeção estatística simulação em memória sem garantia de resultado futuro'],
      dependencies: ['Aprovação humana explícita antes de qualquer alteração de regras no sistema']
    });
  }

  /**
   * Consolida o Dashboard de Simulações Estratégicas.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<StrategyDashboard> {
    const scenarios = await this.getScenarios(organizationId, propertyId);

    const sortedByImpact = [...scenarios].sort((a, b) => b.financialImpact.estimatedMonthlyGain - a.financialImpact.estimatedMonthlyGain);
    const sortedByConfidence = [...scenarios].sort((a, b) => b.confidence - a.confidence);

    const totalConfidence = scenarios.reduce((acc, curr) => acc + curr.confidence, 0);
    const averageConfidence = Number((totalConfidence / (scenarios.length || 1)).toFixed(1));

    const totalMonthlyGain = scenarios.reduce((acc, curr) => acc + curr.financialImpact.estimatedMonthlyGain, 0);
    const totalAnnualGain = scenarios.reduce((acc, curr) => acc + curr.financialImpact.estimatedAnnualGain, 0);

    const highestImpact = sortedByImpact[0] || null;
    const highestConfidence = sortedByConfidence[0] || null;

    const topRecommendation = highestImpact 
      ? `Recomendação de maior impacto: ${highestImpact.title} com ganho estimado de R$ ${highestImpact.financialImpact.estimatedMonthlyGain.toLocaleString('pt-BR')}/mês.`
      : 'Acompanhar métricas operacionais e executar simulações sob demanda.';

    return {
      activeScenariosCount: scenarios.length,
      topScenarios: scenarios.slice(0, 5),
      highestImpactScenario: highestImpact,
      highestConfidenceScenario: highestConfidence,
      averageConfidence,
      topRecommendation,
      overallFinancialPotential: {
        estimatedMonthlyGainTotal: totalMonthlyGain,
        estimatedAnnualGainTotal: totalAnnualGain
      },
      systemStatus: 'read_only',
      simulationMode: 'memory_only'
    };
  }
}

export const strategyRepository = new StrategyRepository();
