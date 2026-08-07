import { planningRepository } from './planningRepository.ts';
import { 
  PlanningDashboard, 
  OperationalPlaybook, 
  PlanningSummaryForAI 
} from './planningTypes.ts';

export class PlanningService {
  /**
   * Obtém o dashboard consolidado de planejamento operacional.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<PlanningDashboard> {
    return planningRepository.getDashboard(organizationId, propertyId);
  }

  /**
   * Obtém os playbooks operacionais ativos.
   */
  async getPlaybooks(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    return planningRepository.getPlaybooks(organizationId, propertyId);
  }

  /**
   * Gera novos playbooks a partir do estado atual de recomendações e aprovações.
   * Não executa nenhuma ação externa.
   */
  async generate(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    return planningRepository.generatePlaybooks(organizationId, propertyId);
  }

  /**
   * Recompondo e reconstruindo sequências de playbooks.
   * Não executa nenhuma ação externa.
   */
  async rebuild(organizationId: string, propertyId: string): Promise<OperationalPlaybook[]> {
    return planningRepository.rebuildPlaybooks(organizationId, propertyId);
  }

  /**
   * Retorna o resumo para o ContextService da IA.
   */
  async getPlanningSummaryForAI(organizationId: string, propertyId: string): Promise<PlanningSummaryForAI> {
    return planningRepository.getPlanningSummaryForAI(organizationId, propertyId);
  }
}

export const planningService = new PlanningService();
