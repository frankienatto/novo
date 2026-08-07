import { MarketingRepository, marketingRepository } from './marketingRepository.ts';
import { 
  MarketingDashboard, 
  MarketingSummaryForAI, 
  MarketingSegmentSummary, 
  MarketGeographicInsight, 
  ChannelPerformance,
  MarketingRetentionAnalysis,
  CustomerJourneyMetrics
} from './marketingTypes.ts';

export class MarketingService {
  private repo?: MarketingRepository;

  constructor(repo?: MarketingRepository) {
    this.repo = repo;
  }

  private getRepo(): MarketingRepository {
    return this.repo || marketingRepository;
  }

  /**
   * Obtém o Dashboard completo do Marketing Intelligence em modo READ ONLY
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<MarketingDashboard> {
    return this.getRepo().getDashboardData(organizationId, propertyId);
  }

  /**
   * Obtém os segmentos de mercado e perfil de clientes
   */
  async getSegments(organizationId: string, propertyId: string): Promise<MarketingSegmentSummary[]> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.segments;
  }

  /**
   * Obtém análises da jornada do cliente (Customer Journey)
   */
  async getCustomerJourney(organizationId: string, propertyId: string): Promise<CustomerJourneyMetrics> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.journey;
  }

  /**
   * Obtém estatísticas geográficas e de mercados
   */
  async getMarkets(organizationId: string, propertyId: string): Promise<MarketGeographicInsight[]> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.topMarkets;
  }

  /**
   * Obtém dados de desempenho de canais de marketing
   */
  async getChannels(organizationId: string, propertyId: string): Promise<ChannelPerformance[]> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.channels;
  }

  /**
   * Obtém análises de retenção e recorrência de clientes
   */
  async getRetentionAnalysis(organizationId: string, propertyId: string): Promise<MarketingRetentionAnalysis> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.retention;
  }

  /**
   * Resumo enxuto de Marketing para injeção no ContextService da IA (sem enviar listas completas)
   */
  async getMarketingSummaryForAI(organizationId: string, propertyId: string): Promise<MarketingSummaryForAI> {
    const dashboard = await this.getDashboard(organizationId, propertyId);

    const topSegments = dashboard.segments
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => ({
        segment: s.label,
        count: s.count,
        percentage: s.percentageOfTotal
      }));

    const topMarkets = dashboard.topMarkets
      .slice(0, 3)
      .map(m => ({
        country: m.country,
        city: m.city,
        guestsCount: m.guestsCount
      }));

    const topPerformingChannel = dashboard.channels.length > 0 ? dashboard.channels[0].channel : 'WhatsApp Direct';

    const marketingAlerts = dashboard.alerts.map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.description}`);

    return {
      topSegments,
      topMarkets,
      retentionRatePercent: dashboard.retention.retentionRatePercent,
      repeatGuestRatioPercent: dashboard.retention.repeatGuestRatioPercent,
      avgDaysBetweenStays: dashboard.retention.avgDaysBetweenStays,
      averageLtv: dashboard.retention.averageEstimatedLtv,
      topPerformingChannel,
      marketingAlerts
    };
  }
}

export const marketingService = new MarketingService();
