import { planningService } from '../planning/planningService.ts';
import { 
  ExecutionRecord, 
  ExecutionDashboard, 
  ExecutionSummaryForAI, 
  ExecutionStatus 
} from './executionTypes.ts';

export class ExecutionRepository {
  private executionsStore: Map<string, ExecutionRecord> = new Map();

  /**
   * Obtém a lista de acompanhamento de execução operacional para playbooks ativos.
   * Consome exclusivamente a API pública do planningService.
   */
  async getExecutions(organizationId: string, propertyId: string): Promise<ExecutionRecord[]> {
    const now = new Date().toISOString();
    const playbooks = await planningService.getPlaybooks(organizationId, propertyId).catch(() => []);

    for (const pb of playbooks) {
      const executionId = `exec_${pb.playbookId}`;
      if (!this.executionsStore.has(executionId)) {
        const remaining = pb.checklist.map(c => c.title);
        const record: ExecutionRecord = {
          executionId,
          playbookId: pb.playbookId,
          title: pb.title,
          status: 'waiting_execution',
          progressPercent: 0,
          updatedAt: now,
          owner: pb.recommendedOwner || 'Operador Responsável',
          sector: pb.responsibleArea || 'general',
          estimatedDuration: pb.estimatedDuration || '30 minutos',
          blocked: false,
          dependencies: pb.dependencies || [],
          completedChecklist: [],
          remainingChecklist: remaining,
          manualNotes: 'Aguardando início de execução manual pelo operador.',
          executionMode: 'manual',
          createdAt: pb.createdAt || now
        };
        this.executionsStore.set(executionId, record);
      }
    }

    return Array.from(this.executionsStore.values());
  }

  /**
   * Inicia a execução manual de um playbook.
   * Altera apenas o estado interno de acompanhamento no Synapse sem nenhuma execução externa.
   */
  async startExecution(executionId: string, owner?: string, notes?: string): Promise<ExecutionRecord> {
    const now = new Date().toISOString();
    let record = this.executionsStore.get(executionId);

    if (!record) {
      // Tentar inicializar do contexto geral
      record = {
        executionId,
        playbookId: executionId.replace('exec_', ''),
        title: 'Execução Operacional Manual',
        status: 'running',
        progressPercent: 20,
        startedAt: now,
        updatedAt: now,
        owner: owner || 'Operador Responsável',
        sector: 'general',
        estimatedDuration: '30 minutos',
        blocked: false,
        dependencies: [],
        completedChecklist: [],
        remainingChecklist: ['Executar instrução manual'],
        manualNotes: notes || 'Execução iniciada manualmente.',
        executionMode: 'manual',
        createdAt: now
      };
    } else {
      record.status = 'running';
      record.startedAt = record.startedAt || now;
      record.updatedAt = now;
      record.progressPercent = Math.max(record.progressPercent, 25);
      if (owner) record.owner = owner;
      if (notes) record.manualNotes = notes;
    }

    this.executionsStore.set(executionId, record);
    return record;
  }

  /**
   * Atualiza o progresso da execução manual.
   */
  async updateProgress(
    executionId: string, 
    progressPercent: number, 
    completedStepIds?: string[], 
    notes?: string,
    blocked?: boolean,
    blockReason?: string
  ): Promise<ExecutionRecord> {
    const now = new Date().toISOString();
    let record = this.executionsStore.get(executionId);

    if (!record) {
      throw new Error(`Execução com ID ${executionId} não encontrada.`);
    }

    record.progressPercent = Math.min(Math.max(progressPercent, 0), 100);
    record.updatedAt = now;

    if (blocked !== undefined) {
      record.blocked = blocked;
      if (blocked) {
        record.status = 'blocked';
        record.blockReason = blockReason || 'Bloqueio operacional informado pelo operador.';
      } else {
        record.status = record.progressPercent >= 100 ? 'completed' : 'running';
        record.blockReason = undefined;
      }
    }

    if (completedStepIds && completedStepIds.length > 0) {
      record.completedChecklist = Array.from(new Set([...record.completedChecklist, ...completedStepIds]));
      record.remainingChecklist = record.remainingChecklist.filter(item => !completedStepIds.includes(item));
    }

    if (notes) {
      record.manualNotes = notes;
    }

    this.executionsStore.set(executionId, record);
    return record;
  }

  /**
   * Conclui manualmente a execução de um playbook.
   */
  async completeExecution(executionId: string, owner?: string, notes?: string): Promise<ExecutionRecord> {
    const now = new Date().toISOString();
    let record = this.executionsStore.get(executionId);

    if (!record) {
      throw new Error(`Execução com ID ${executionId} não encontrada.`);
    }

    record.status = 'completed';
    record.progressPercent = 100;
    record.completedAt = now;
    record.updatedAt = now;
    record.blocked = false;
    record.blockReason = undefined;
    record.completedChecklist = [...record.completedChecklist, ...record.remainingChecklist];
    record.remainingChecklist = [];
    if (owner) record.owner = owner;
    if (notes) record.manualNotes = notes || 'Concluído manualmente pelo operador.';

    this.executionsStore.set(executionId, record);
    return record;
  }

  /**
   * Dashboard de Acompanhamento de Execução Operacional.
   */
  async getDashboard(organizationId: string, propertyId: string): Promise<ExecutionDashboard> {
    const executions = await this.getExecutions(organizationId, propertyId);

    const waiting = executions.filter(e => e.status === 'waiting_execution');
    const running = executions.filter(e => e.status === 'running');
    const completed = executions.filter(e => e.status === 'completed');
    const blocked = executions.filter(e => e.status === 'blocked');

    const productivityBySector: Record<string, number> = {};
    const productivityByOwner: Record<string, number> = {};

    executions.forEach(e => {
      productivityBySector[e.sector] = (productivityBySector[e.sector] || 0) + (e.status === 'completed' ? 1 : 0);
      productivityByOwner[e.owner] = (productivityByOwner[e.owner] || 0) + (e.status === 'completed' ? 1 : 0);
    });

    return {
      waitingCount: waiting.length,
      runningCount: running.length,
      completedCount: completed.length,
      blockedCount: blocked.length,
      averageExecutionTimeMinutes: 28,
      deviations: [
        'Tempo de resposta humana acima do SLA estimado na recepção',
        'Atraso no preenchimento de checklist de conferência de balcão'
      ],
      bottlenecks: [
        'Aguardando liberação de UH pela equipe de manutenção/governança',
        'Sincronização manual no Aloha PMS pendente de confirmação do turno'
      ],
      productivityBySector,
      productivityByOwner,
      delayedPlaybooks: waiting.filter(e => e.dependencies && e.dependencies.length > 0),
      executions,
      systemStatus: 'read_only_tracking'
    };
  }

  /**
   * Resumo de execução operacional para a IA (executionSummary).
   */
  async getExecutionSummaryForAI(organizationId: string, propertyId: string): Promise<ExecutionSummaryForAI> {
    const dash = await this.getDashboard(organizationId, propertyId);
    const executions = dash.executions;

    const totalProgress = executions.reduce((sum, e) => sum + e.progressPercent, 0);
    const averageProgress = executions.length > 0 ? Math.round(totalProgress / executions.length) : 0;
    const criticalExecutions = dash.blockedCount > 0 
      ? `${dash.blockedCount} execução(ões) bloqueada(s) necessitando atenção humana` 
      : 'Nenhuma execução bloqueada no momento';

    return {
      waiting: dash.waitingCount,
      running: dash.runningCount,
      completed: dash.completedCount,
      blocked: dash.blockedCount,
      averageProgress,
      criticalExecutions
    };
  }
}

export const executionRepository = new ExecutionRepository();
