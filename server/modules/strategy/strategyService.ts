import { strategyRepository } from './strategyRepository.ts';
import { 
  StrategyDashboard, 
  SimulationScenario, 
  SimulationParams, 
  StrategySummaryForAI 
} from './strategyTypes.ts';

export class StrategyService {
  /**
   * Obtém o dashboard consolidado de simulações estratégicas ("What If").
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<StrategyDashboard> {
    return strategyRepository.getDashboard(organizationId, propertyId);
  }

  /**
   * Obtém todos os cenários simulações padrão em memória.
   */
  async getScenarios(organizationId: string, propertyId: string): Promise<SimulationScenario[]> {
    return strategyRepository.getScenarios(organizationId, propertyId);
  }

  /**
   * Executa uma simulação pontual customizada em memória sem alterar nada no banco.
   */
  async simulate(params: SimulationParams, organizationId: string, propertyId: string): Promise<SimulationScenario> {
    return strategyRepository.simulateCustomScenario(params, organizationId, propertyId);
  }

  /**
   * Retorna o resumo das simulações estratégicas para o ContextService da IA.
   * Contém apenas resumos agregados (sem listas completas).
   */
  async getStrategySummaryForAI(organizationId: string, propertyId: string): Promise<StrategySummaryForAI> {
    const dash = await strategyRepository.getDashboard(organizationId, propertyId);

    return {
      totalScenarios: dash.activeScenariosCount,
      highestImpactScenario: dash.highestImpactScenario?.title || 'Nenhum cenário cadastrado',
      highestConfidenceScenario: dash.highestConfidenceScenario?.title || 'Nenhum cenário cadastrado',
      topRecommendation: dash.topRecommendation,
      averageConfidence: dash.averageConfidence
    };
  }
}

export const strategyService = new StrategyService();
