import { DirectBookingRepository, directBookingRepository } from './directBookingRepository.ts';
import { 
  CommercialProposal, 
  DirectBookingMetrics, 
  DirectBookingDashboard, 
  DirectBookingSummaryForAI, 
  CreateProposalDTO, 
  UpdateProposalDTO 
} from './directBookingTypes.ts';

export class DirectBookingService {
  private repo?: DirectBookingRepository;

  constructor(repo?: DirectBookingRepository) {
    this.repo = repo;
  }

  private getRepo(): DirectBookingRepository {
    return this.repo || directBookingRepository;
  }

  /**
   * Obtém o Dashboard Comercial Completo de Direct Booking
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<DirectBookingDashboard> {
    const proposals = await this.getRepo().listProposals(organizationId, propertyId);
    
    // Auto-expirar propostas cuja data de validade venceu
    const now = new Date();
    for (const p of proposals) {
      if (['sent', 'viewed', 'negotiating'].includes(p.status) && new Date(p.validUntil) < now) {
        p.status = 'expired';
        p.updatedAt = now.toISOString();
      }
    }

    const metrics = this.calculateMetrics(proposals);

    const recentProposals = [...proposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const expiringProposals = proposals
      .filter(p => ['sent', 'viewed', 'negotiating'].includes(p.status))
      .sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime())
      .slice(0, 5);

    return {
      summary: metrics,
      recentProposals,
      expiringProposals,
      generatedAt: now.toISOString()
    };
  }

  /**
   * Obtém Métricas Comerciais Consolidadas
   */
  async getMetrics(organizationId: string, propertyId: string): Promise<DirectBookingMetrics> {
    const proposals = await this.getRepo().listProposals(organizationId, propertyId);
    return this.calculateMetrics(proposals);
  }

  /**
   * Lista todas as propostas comerciais
   */
  async listProposals(organizationId: string, propertyId: string, status?: string): Promise<CommercialProposal[]> {
    const proposals = await this.getRepo().listProposals(organizationId, propertyId);
    if (status) {
      return proposals.filter(p => p.status === status);
    }
    return proposals;
  }

  /**
   * Obtém proposta por ID
   */
  async getProposalById(proposalId: string, organizationId: string, propertyId: string): Promise<CommercialProposal | null> {
    return this.getRepo().getProposalById(proposalId, organizationId, propertyId);
  }

  /**
   * Cria nova Proposta Comercial (Inquiry / Lead)
   */
  async createProposal(organizationId: string, propertyId: string, dto: CreateProposalDTO): Promise<CommercialProposal> {
    return this.getRepo().createProposal(organizationId, propertyId, dto);
  }

  /**
   * Atualiza status ou dados de uma Proposta Comercial
   */
  async updateProposal(proposalId: string, organizationId: string, propertyId: string, dto: UpdateProposalDTO): Promise<CommercialProposal | null> {
    return this.getRepo().updateProposal(proposalId, organizationId, propertyId, dto);
  }

  /**
   * Resumo Executivo Comercial para Injeção no ContextService da IA
   */
  async getDirectBookingSummaryForAI(organizationId: string, propertyId: string): Promise<DirectBookingSummaryForAI> {
    const metrics = await this.getMetrics(organizationId, propertyId);

    // Identificar principal canal de origem dos leads
    let topLeadSource = 'WhatsApp Direct';
    let maxChannelCount = 0;
    for (const [channel, data] of Object.entries(metrics.conversionByChannel)) {
      if (data.total > maxChannelCount) {
        maxChannelCount = data.total;
        topLeadSource = channel;
      }
    }

    const commercialAlerts: string[] = [];
    const commercialOpportunities: string[] = [];

    if (metrics.openProposalsCount > 0) {
      commercialAlerts.push(`${metrics.openProposalsCount} propostas comerciais em aberto totalizando R$ ${metrics.totalPotentialRevenueOpen.toFixed(2)} em potencial.`);
    }

    if (metrics.conversionRatePercent < 25) {
      commercialAlerts.push(`Taxa de conversão de reservas diretas abaixo da média recomendada (${metrics.conversionRatePercent}%). Avaliar follow-ups rápidos.`);
    } else {
      commercialOpportunities.push(`Boa taxa de conversão em reservas diretas (${metrics.conversionRatePercent}%). Oportunidade de incentivar upsell.`);
    }

    if (metrics.expiredProposalsCount > 0) {
      commercialOpportunities.push(`${metrics.expiredProposalsCount} propostas expiradas podem ser reengajadas com condições especiais.`);
    }

    return {
      openProposalsCount: metrics.openProposalsCount,
      convertedProposalsCount: metrics.convertedProposalsCount,
      conversionRatePercent: metrics.conversionRatePercent,
      totalPotentialRevenueOpen: metrics.totalPotentialRevenueOpen,
      totalConvertedRevenue: metrics.totalConvertedRevenue,
      topLeadSource,
      commercialAlerts,
      commercialOpportunities
    };
  }

  // --- CÁLCULOS INTERNOS DE KPIs ---

  private calculateMetrics(proposals: CommercialProposal[]): DirectBookingMetrics {
    const totalProposals = proposals.length;
    let openProposalsCount = 0;
    let convertedProposalsCount = 0;
    let expiredProposalsCount = 0;
    let rejectedProposalsCount = 0;

    let totalPotentialRevenueOpen = 0;
    let totalConvertedRevenue = 0;
    let totalLostRevenue = 0;

    let totalConversionHoursSum = 0;
    let convertedCountWithTime = 0;

    const conversionByChannel: Record<string, { total: number; converted: number; conversionRate: number }> = {};
    const conversionByAttendant: Record<string, { total: number; converted: number; revenue: number }> = {};

    for (const p of proposals) {
      const channel = p.sourceChannel || 'outros';
      if (!conversionByChannel[channel]) {
        conversionByChannel[channel] = { total: 0, converted: 0, conversionRate: 0 };
      }
      conversionByChannel[channel].total++;

      const attendant = p.attendantName || 'Não Atribuído';
      if (!conversionByAttendant[attendant]) {
        conversionByAttendant[attendant] = { total: 0, converted: 0, revenue: 0 };
      }
      conversionByAttendant[attendant].total++;

      if (['draft', 'sent', 'viewed', 'negotiating'].includes(p.status)) {
        openProposalsCount++;
        totalPotentialRevenueOpen += p.totalAmount || 0;
      } else if (p.status === 'accepted') {
        convertedProposalsCount++;
        totalConvertedRevenue += p.totalAmount || 0;
        conversionByChannel[channel].converted++;
        conversionByAttendant[attendant].converted++;
        conversionByAttendant[attendant].revenue += p.totalAmount || 0;

        if (p.convertedAt && p.createdAt) {
          const createdTime = new Date(p.createdAt).getTime();
          const convertedTime = new Date(p.convertedAt).getTime();
          const hours = (convertedTime - createdTime) / (1000 * 60 * 60);
          if (hours >= 0) {
            totalConversionHoursSum += hours;
            convertedCountWithTime++;
          }
        }
      } else if (p.status === 'expired') {
        expiredProposalsCount++;
        totalLostRevenue += p.totalAmount || 0;
      } else if (p.status === 'rejected') {
        rejectedProposalsCount++;
        totalLostRevenue += p.totalAmount || 0;
      }
    }

    // Calcula taxas de conversão por canal
    for (const channelKey of Object.keys(conversionByChannel)) {
      const ch = conversionByChannel[channelKey];
      ch.conversionRate = ch.total > 0 ? Number(((ch.converted / ch.total) * 100).toFixed(1)) : 0;
    }

    const conversionRatePercent = totalProposals > 0 
      ? Number(((convertedProposalsCount / totalProposals) * 100).toFixed(1)) 
      : 0;

    const avgConversionTimeHours = convertedCountWithTime > 0 
      ? Number((totalConversionHoursSum / convertedCountWithTime).toFixed(1)) 
      : 0;

    const avgTicketValue = convertedProposalsCount > 0 
      ? Number((totalConvertedRevenue / convertedProposalsCount).toFixed(2)) 
      : 0;

    return {
      totalInquiries: totalProposals,
      totalProposals,
      openProposalsCount,
      convertedProposalsCount,
      expiredProposalsCount,
      rejectedProposalsCount,
      conversionRatePercent,
      avgConversionTimeHours,
      totalPotentialRevenueOpen: Number(totalPotentialRevenueOpen.toFixed(2)),
      totalConvertedRevenue: Number(totalConvertedRevenue.toFixed(2)),
      totalLostRevenue: Number(totalLostRevenue.toFixed(2)),
      avgTicketValue,
      conversionByChannel,
      conversionByAttendant
    };
  }
}

export const directBookingService = new DirectBookingService();
