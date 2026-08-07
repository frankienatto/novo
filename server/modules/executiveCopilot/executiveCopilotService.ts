import { executiveCopilotRepository } from './executiveCopilotRepository.ts';
import { 
  ExecutiveCopilotDashboard, 
  HealthScoreBreakdown, 
  ExecutiveRisk, 
  ExecutiveOpportunity, 
  ExecutiveDailyBrief,
  ExecutiveCopilotSummaryForAI 
} from './executiveCopilotTypes.ts';

export class ExecutiveCopilotService {
  /**
   * Obtém o dashboard completo do Executive Copilot
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ExecutiveCopilotDashboard> {
    return executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
  }

  /**
   * Obtém apenas os scores de saúde estratégica da propriedade
   */
  async getHealth(organizationId: string, propertyId: string): Promise<HealthScoreBreakdown> {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return dash.healthScores;
  }

  /**
   * Obtém os riscos operacionais e estratégicos (Top 10)
   */
  async getRisks(organizationId: string, propertyId: string): Promise<ExecutiveRisk[]> {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return dash.topRisks;
  }

  /**
   * Obtém as oportunidades estratégicas identificadas (Top 10)
   */
  async getOpportunities(organizationId: string, propertyId: string): Promise<ExecutiveOpportunity[]> {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return dash.topOpportunities;
  }

  /**
   * Obtém o Executive Daily Brief
   */
  async getBrief(organizationId: string, propertyId: string): Promise<ExecutiveDailyBrief> {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return dash.dailyBrief;
  }

  /**
   * Obtém o resumo compacto executivo
   */
  async getSummary(organizationId: string, propertyId: string) {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return {
      overallHealthScore: dash.healthScores.overallScore,
      riskScore: dash.riskScore,
      opportunityScore: dash.opportunityScore,
      primaryFocusArea: dash.dailyBrief.primaryFocusArea,
      topPriority: dash.recommendedPriorities[0] || 'Acompanhamento de rotina',
      topRiskTitle: dash.topRisks[0]?.title || 'Sem riscos críticos detectados',
      topOpportunityTitle: dash.topOpportunities[0]?.title || 'Sem oportunidades urgentes'
    };
  }

  /**
   * Retorna resumo ultra-compacto para o ContextService da IA (evita estouro de janela)
   */
  async getExecutiveCopilotSummaryForAI(organizationId: string, propertyId: string): Promise<ExecutiveCopilotSummaryForAI> {
    const dash = await executiveCopilotRepository.getCopilotDashboard(organizationId, propertyId);
    return {
      healthScore: dash.healthScores.overallScore,
      riskScore: dash.riskScore,
      opportunityScore: dash.opportunityScore,
      topRisks: dash.topRisks.slice(0, 5).map(r => `[${r.severity.toUpperCase()}] ${r.title}`),
      topOpportunities: dash.topOpportunities.slice(0, 5).map(o => o.title),
      topPriorities: dash.recommendedPriorities.slice(0, 5),
      executiveBrief: dash.dailyBrief.summary
    };
  }
}

export const executiveCopilotService = new ExecutiveCopilotService();
