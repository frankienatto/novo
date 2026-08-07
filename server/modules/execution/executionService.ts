import { executionRepository } from './executionRepository.ts';
import { 
  ExecutionDashboard, 
  ExecutionRecord, 
  ExecutionSummaryForAI 
} from './executionTypes.ts';

export class ExecutionService {
  /**
   * Obtém o dashboard de acompanhamento da execução operacional humana.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ExecutionDashboard> {
    return executionRepository.getDashboard(organizationId, propertyId);
  }

  /**
   * Lista todas as execuções operacionais registradas.
   */
  async getExecutions(organizationId: string, propertyId: string): Promise<ExecutionRecord[]> {
    return executionRepository.getExecutions(organizationId, propertyId);
  }

  /**
   * Inicia o acompanhamento da execução manual de um playbook.
   * Não executa nenhuma ação externa.
   */
  async startExecution(executionId: string, owner?: string, notes?: string): Promise<ExecutionRecord> {
    return executionRepository.startExecution(executionId, owner, notes);
  }

  /**
   * Atualiza o progresso de execução manual do operador.
   * Não executa nenhuma ação externa.
   */
  async updateProgress(
    executionId: string, 
    progressPercent: number, 
    completedStepIds?: string[], 
    notes?: string,
    blocked?: boolean,
    blockReason?: string
  ): Promise<ExecutionRecord> {
    return executionRepository.updateProgress(executionId, progressPercent, completedStepIds, notes, blocked, blockReason);
  }

  /**
   * Conclui o acompanhamento da execução manual de um playbook.
   * Não executa nenhuma ação externa.
   */
  async completeExecution(executionId: string, owner?: string, notes?: string): Promise<ExecutionRecord> {
    return executionRepository.completeExecution(executionId, owner, notes);
  }

  /**
   * Retorna o resumo sintético de execução para a IA (executionSummary).
   */
  async getExecutionSummaryForAI(organizationId: string, propertyId: string): Promise<ExecutionSummaryForAI> {
    return executionRepository.getExecutionSummaryForAI(organizationId, propertyId);
  }
}

export const executionService = new ExecutionService();
