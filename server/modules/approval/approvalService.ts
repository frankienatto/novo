import { approvalRepository } from './approvalRepository.ts';
import { 
  ApprovalDashboard, 
  ApprovalRecord, 
  ActionDecisionParams, 
  ApprovalSummaryForAI 
} from './approvalTypes.ts';

export class ApprovalService {
  /**
   * Obtém o dashboard consolidado do Human Approval Workflow.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ApprovalDashboard> {
    return approvalRepository.getDashboard(organizationId, propertyId);
  }

  /**
   * Obtém lista de aprovações pendentes.
   */
  async getPending(organizationId: string, propertyId: string): Promise<ApprovalRecord[]> {
    return approvalRepository.getPendingApprovals(organizationId, propertyId);
  }

  /**
   * Obtém histórico auditável de decisões tomadas.
   */
  async getHistory(organizationId: string, propertyId: string): Promise<ApprovalRecord[]> {
    return approvalRepository.getApprovalHistory(organizationId, propertyId);
  }

  /**
   * Registra a aprovação humana de uma recomendação.
   * Altera apenas o estado interno de governança no Synapse.
   * NUNCA executa ações externas ou operacionais.
   */
  async approve(params: ActionDecisionParams, organizationId: string, propertyId: string): Promise<ApprovalRecord> {
    return approvalRepository.approveRecommendation(params, organizationId, propertyId);
  }

  /**
   * Registra a rejeição humana de uma recomendação.
   * Altera apenas o estado interno de governança no Synapse.
   * NUNCA executa ações externas ou operacionais.
   */
  async reject(params: ActionDecisionParams, organizationId: string, propertyId: string): Promise<ApprovalRecord> {
    return approvalRepository.rejectRecommendation(params, organizationId, propertyId);
  }

  /**
   * Retorna o resumo para o ContextService da IA.
   */
  async getApprovalSummaryForAI(organizationId: string, propertyId: string): Promise<ApprovalSummaryForAI> {
    return approvalRepository.getApprovalSummaryForAI(organizationId, propertyId);
  }
}

export const approvalService = new ApprovalService();
