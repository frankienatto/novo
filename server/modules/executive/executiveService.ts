import { ExecutiveRepository, executiveRepository } from './executiveRepository.ts';
import { 
  ExecutiveDashboard, 
  ExecutiveKpis, 
  ExecutiveAlert, 
  ExecutivePriorities, 
  ExecutiveSummaryModule, 
  ExecutiveSummaryForAI 
} from './executiveTypes.ts';

export class ExecutiveService {
  private repo?: ExecutiveRepository;

  constructor(repo?: ExecutiveRepository) {
    this.repo = repo;
  }

  private getRepo(): ExecutiveRepository {
    return this.repo || executiveRepository;
  }

  /**
   * Obtém o Dashboard completo de Executive Intelligence em modo READ ONLY
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ExecutiveDashboard> {
    return this.getRepo().getDashboardData(organizationId, propertyId);
  }

  /**
   * Obtém os KPIs consolidados da diretoria
   */
  async getKpis(organizationId: string, propertyId: string): Promise<ExecutiveKpis> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.kpis;
  }

  /**
   * Obtém os alertas estratégicos e operacionais
   */
  async getAlerts(organizationId: string, propertyId: string): Promise<ExecutiveAlert[]> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.alerts;
  }

  /**
   * Obtém as prioridades executivas e riscos
   */
  async getPriorities(organizationId: string, propertyId: string): Promise<ExecutivePriorities> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.priorities;
  }

  /**
   * Obtém os resumos consolidados dos módulos
   */
  async getSummaryModule(organizationId: string, propertyId: string): Promise<ExecutiveSummaryModule> {
    const dashboard = await this.getDashboard(organizationId, propertyId);
    return dashboard.summary;
  }

  /**
   * Resumo executivo enxuto para injeção no ContextService da IA (sem listas extensas)
   */
  async getExecutiveSummaryForAI(organizationId: string, propertyId: string): Promise<ExecutiveSummaryForAI> {
    const dashboard = await this.getDashboard(organizationId, propertyId);

    return {
      kpis: {
        totalRevenue: dashboard.kpis.revenue.totalRevenue,
        adr: dashboard.kpis.revenue.adr,
        revpar: dashboard.kpis.revenue.revpar,
        occupancyRatePercent: dashboard.kpis.revenue.occupancyRatePercent,
        pipelineValue: dashboard.kpis.commercial.pipelineValue,
        retentionRatePercent: dashboard.kpis.retentionAndMarketing.retentionRatePercent,
        averageLtv: dashboard.kpis.retentionAndMarketing.averageLtv
      },
      topDailyPriorities: dashboard.priorities.dailyPriorities.slice(0, 3),
      topOperationalRisks: dashboard.priorities.operationalRisks.slice(0, 3),
      topExecutiveAlerts: dashboard.alerts.slice(0, 3).map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.description}`)
    };
  }
}

export const executiveService = new ExecutiveService();
