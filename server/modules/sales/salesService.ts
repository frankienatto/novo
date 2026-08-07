import { SalesRepository, salesRepository } from './salesRepository.ts';
import { 
  SalesOpportunity, 
  SalesMetrics, 
  SalesDashboard, 
  SalesSummaryForAI, 
  CreateOpportunityDTO, 
  UpdateOpportunityDTO, 
  AddInteractionDTO, 
  ScheduleFollowUpDTO,
  PipelineStage
} from './salesTypes.ts';

export class SalesService {
  private repo?: SalesRepository;

  constructor(repo?: SalesRepository) {
    this.repo = repo;
  }

  private getRepo(): SalesRepository {
    return this.repo || salesRepository;
  }

  /**
   * Obtém o Dashboard do Sales CRM com Métricas, Oportunidades em Destaque e Follow-ups Atrasados
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<SalesDashboard> {
    const opportunities = await this.getRepo().listOpportunities(organizationId, propertyId);
    const summary = this.calculateMetrics(opportunities);

    const todayStr = new Date().toISOString().substring(0, 10);

    // Oportunidades em destaque (Maior valor estimado / Maior Score)
    const topOpportunities = [...opportunities]
      .filter(o => o.stage !== 'lost' && o.stage !== 'cancelled')
      .sort((a, b) => b.score - a.score || b.estimatedValue - a.estimatedValue)
      .slice(0, 10);

    // Follow-ups atrasados ou para hoje
    const overdueFollowUps = opportunities.filter(o => {
      if (!o.nextFollowUp || o.nextFollowUp.completed) return false;
      return o.nextFollowUp.dueDate <= todayStr;
    }).sort((a, b) => a.nextFollowUp!.dueDate.localeCompare(b.nextFollowUp!.dueDate));

    // Interações recentes acumuladas
    const recentInteractions: { opportunityId: string; leadName: string; interaction: any }[] = [];
    for (const opp of opportunities) {
      for (const inter of opp.interactions) {
        recentInteractions.push({
          opportunityId: opp.opportunityId,
          leadName: opp.leadName,
          interaction: inter
        });
      }
    }
    recentInteractions.sort((a, b) => new Date(b.interaction.createdAt).getTime() - new Date(a.interaction.createdAt).getTime());

    return {
      summary,
      topOpportunities,
      overdueFollowUps,
      recentInteractions: recentInteractions.slice(0, 10),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtém Métricas Consolidadas do Sales CRM
   */
  async getMetrics(organizationId: string, propertyId: string): Promise<SalesMetrics> {
    const opportunities = await this.getRepo().listOpportunities(organizationId, propertyId);
    return this.calculateMetrics(opportunities);
  }

  /**
   * Lista oportunidades de vendas com filtro opcional de estágio, temperatura ou responsável
   */
  async listOpportunities(
    organizationId: string, 
    propertyId: string, 
    filter?: { stage?: PipelineStage; ownerName?: string; temperature?: string }
  ): Promise<SalesOpportunity[]> {
    let list = await this.getRepo().listOpportunities(organizationId, propertyId);
    if (filter?.stage) {
      list = list.filter(o => o.stage === filter.stage);
    }
    if (filter?.ownerName) {
      list = list.filter(o => o.ownerName.toLowerCase().includes(filter.ownerName!.toLowerCase()));
    }
    if (filter?.temperature) {
      list = list.filter(o => o.temperature === filter.temperature);
    }
    return list;
  }

  /**
   * Obtém detalhes de uma oportunidade por ID
   */
  async getOpportunityById(opportunityId: string, organizationId: string, propertyId: string): Promise<SalesOpportunity | null> {
    return this.getRepo().getOpportunityById(opportunityId, organizationId, propertyId);
  }

  /**
   * Cria nova oportunidade de vendas no pipeline comercial
   */
  async createOpportunity(organizationId: string, propertyId: string, dto: CreateOpportunityDTO): Promise<SalesOpportunity> {
    return this.getRepo().createOpportunity(organizationId, propertyId, dto);
  }

  /**
   * Atualiza uma oportunidade de vendas existente
   */
  async updateOpportunity(
    opportunityId: string, 
    organizationId: string, 
    propertyId: string, 
    dto: UpdateOpportunityDTO
  ): Promise<SalesOpportunity | null> {
    return this.getRepo().updateOpportunity(opportunityId, organizationId, propertyId, dto);
  }

  /**
   * Registra uma interação comercial (Ligação, WhatsApp, Email, Nota)
   */
  async addInteraction(
    opportunityId: string, 
    organizationId: string, 
    propertyId: string, 
    dto: AddInteractionDTO
  ): Promise<SalesOpportunity | null> {
    return this.getRepo().addInteraction(opportunityId, organizationId, propertyId, dto);
  }

  /**
   * Agenda ou atualiza o próximo follow-up de uma oportunidade
   */
  async scheduleFollowUp(
    opportunityId: string, 
    organizationId: string, 
    propertyId: string, 
    dto: ScheduleFollowUpDTO
  ): Promise<SalesOpportunity | null> {
    return this.getRepo().scheduleFollowUp(opportunityId, organizationId, propertyId, dto);
  }

  /**
   * Resumo enxuto para injeção no ContextService da IA (sem enviar listas completas)
   */
  async getSalesSummaryForAI(organizationId: string, propertyId: string): Promise<SalesSummaryForAI> {
    const metrics = await this.getMetrics(organizationId, propertyId);

    // Identificar canal com maior taxa de conversão
    let topPerformingChannel = 'WhatsApp Direct';
    let maxRate = 0;
    for (const [channel, data] of Object.entries(metrics.pipelineBySource)) {
      if (data.conversionRate > maxRate) {
        maxRate = data.conversionRate;
        topPerformingChannel = channel;
      }
    }

    const commercialAlerts: string[] = [];
    const salesOpportunities: string[] = [];

    if (metrics.overdueFollowUpsCount > 0) {
      commercialAlerts.push(`Atenção: ${metrics.overdueFollowUpsCount} follow-ups comerciais estão com a data de ação expirada ou vencendo hoje.`);
    }

    if (metrics.hotLeadsCount > 0) {
      salesOpportunities.push(`${metrics.hotLeadsCount} leads quentes (Hot) estão no pipeline demandando fechamento rápido.`);
    }

    if (metrics.totalPipelineValue > 0) {
      salesOpportunities.push(`Valor total do pipeline em negociação/aberto: R$ ${metrics.totalPipelineValue.toFixed(2)}.`);
    }

    return {
      totalPipelineValue: metrics.totalPipelineValue,
      openOpportunitiesCount: metrics.totalOpportunities - metrics.wonDealsCount - metrics.lostDealsCount,
      hotLeadsCount: metrics.hotLeadsCount,
      wonDealsCount: metrics.wonDealsCount,
      overdueFollowUpsCount: metrics.overdueFollowUpsCount,
      conversionRatePercent: metrics.conversionRatePercent,
      topPerformingChannel,
      commercialAlerts,
      salesOpportunities
    };
  }

  // --- CÁLCULOS INTERNOS DE KPIs DO SALES CRM ---

  private calculateMetrics(opportunities: SalesOpportunity[]): SalesMetrics {
    const totalOpportunities = opportunities.length;
    let totalLeads = 0;
    let totalProposals = 0;
    let wonDealsCount = 0;
    let lostDealsCount = 0;
    let hotLeadsCount = 0;
    let overdueFollowUpsCount = 0;

    let totalPipelineValue = 0;
    let totalWonValue = 0;
    let totalLostValue = 0;

    let totalConversionDaysSum = 0;
    let convertedCountWithDays = 0;

    const todayStr = new Date().toISOString().substring(0, 10);

    const pipelineByStage: Record<PipelineStage, { count: number; totalValue: number }> = {
      lead: { count: 0, totalValue: 0 },
      inquiry: { count: 0, totalValue: 0 },
      opportunity: { count: 0, totalValue: 0 },
      proposal: { count: 0, totalValue: 0 },
      negotiation: { count: 0, totalValue: 0 },
      won: { count: 0, totalValue: 0 },
      lost: { count: 0, totalValue: 0 },
      cancelled: { count: 0, totalValue: 0 }
    };

    const pipelineByOwner: Record<string, { count: number; wonCount: number; wonValue: number }> = {};
    const pipelineBySource: Record<string, { count: number; wonCount: number; conversionRate: number }> = {};

    for (const opp of opportunities) {
      // Estágio
      if (pipelineByStage[opp.stage]) {
        pipelineByStage[opp.stage].count++;
        pipelineByStage[opp.stage].totalValue += opp.estimatedValue || 0;
      }

      // Responsável
      const owner = opp.ownerName || 'Não Atribuído';
      if (!pipelineByOwner[owner]) {
        pipelineByOwner[owner] = { count: 0, wonCount: 0, wonValue: 0 };
      }
      pipelineByOwner[owner].count++;

      // Origem
      const source = opp.source || 'other';
      if (!pipelineBySource[source]) {
        pipelineBySource[source] = { count: 0, wonCount: 0, conversionRate: 0 };
      }
      pipelineBySource[source].count++;

      if (opp.stage === 'lead') totalLeads++;
      if (opp.stage === 'proposal') totalProposals++;

      if (opp.temperature === 'hot') hotLeadsCount++;

      // Checa follow-up atrasado
      if (opp.nextFollowUp && !opp.nextFollowUp.completed && opp.nextFollowUp.dueDate <= todayStr) {
        overdueFollowUpsCount++;
      }

      if (opp.stage === 'won') {
        wonDealsCount++;
        totalWonValue += opp.estimatedValue || 0;
        pipelineByOwner[owner].wonCount++;
        pipelineByOwner[owner].wonValue += opp.estimatedValue || 0;
        pipelineBySource[source].wonCount++;

        if (opp.convertedAt && opp.createdAt) {
          const createdTime = new Date(opp.createdAt).getTime();
          const convertedTime = new Date(opp.convertedAt).getTime();
          const days = (convertedTime - createdTime) / (1000 * 60 * 60 * 24);
          if (days >= 0) {
            totalConversionDaysSum += days;
            convertedCountWithDays++;
          }
        }
      } else if (opp.stage === 'lost' || opp.stage === 'cancelled') {
        lostDealsCount++;
        totalLostValue += opp.estimatedValue || 0;
      } else {
        totalPipelineValue += opp.estimatedValue || 0;
      }
    }

    // Calcula taxa de conversão por origem
    for (const sourceKey of Object.keys(pipelineBySource)) {
      const src = pipelineBySource[sourceKey];
      src.conversionRate = src.count > 0 ? Number(((src.wonCount / src.count) * 100).toFixed(1)) : 0;
    }

    const conversionRatePercent = totalOpportunities > 0 
      ? Number(((wonDealsCount / totalOpportunities) * 100).toFixed(1)) 
      : 0;

    const avgConversionTimeDays = convertedCountWithDays > 0 
      ? Number((totalConversionDaysSum / convertedCountWithDays).toFixed(1)) 
      : 0;

    return {
      totalLeads,
      totalOpportunities,
      totalProposals,
      wonDealsCount,
      lostDealsCount,
      conversionRatePercent,
      avgConversionTimeDays,
      totalPipelineValue: Number(totalPipelineValue.toFixed(2)),
      totalWonValue: Number(totalWonValue.toFixed(2)),
      totalLostValue: Number(totalLostValue.toFixed(2)),
      hotLeadsCount,
      overdueFollowUpsCount,
      pipelineByStage,
      pipelineByOwner,
      pipelineBySource
    };
  }
}

export const salesService = new SalesService();
