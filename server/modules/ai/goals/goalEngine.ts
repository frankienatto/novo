import { 
  StrategicGoal, 
  GoalDefinition, 
  GoalStatus,
  GoalExecutionContext
} from './goalTypes.ts';
import { goalRegistry } from './goalRegistry.ts';
import { goalStateMachine } from './goalStateMachine.ts';
import { goalPlanner } from './goalPlanner.ts';
import { goalExecutor } from './goalExecutor.ts';
import { goalValidator } from './goalValidator.ts';
import { goalProgressTracker } from './goalProgressTracker.ts';
import { agentEventBus } from '../orchestrator/agentEventBus.ts';
import { agentSharedMemory } from '../orchestrator/agentSharedMemory.ts';
import { logger } from '../../../utils/logger.ts';

export interface CreateGoalParams {
  definition?: GoalDefinition;
  templateId?: string;
  organizationId: string;
  propertyId: string;
  sessionId?: string;
  actor?: string;
}

export class GoalEngine {
  constructor() {
    // Inscrever escuta no EventBus para sincronização e aprovação automática
    agentEventBus.subscribe('approval:action_decision', async (event) => {
      const { recommendationId, action, decisionBy } = event.payload || {};
      if (action === 'approved' && recommendationId) {
        const goals = goalRegistry.listGoals({ organizationId: event.organizationId, propertyId: event.propertyId });
        for (const g of goals) {
          const task = g.tasks.find(t => t.taskId === recommendationId || g.goalId === recommendationId);
          if (task && task.status === 'WAITING_APPROVAL') {
            try {
              await this.approveGoalTask(g.goalId, task.taskId, decisionBy || 'ApprovalEngine');
            } catch (err: any) {
              logger.warn(`⚠️ [GoalEngine] Auto-aprovação de tarefa via EventBus ignorada/falhada: ${err?.message}`);
            }
          }
        }
      }
    });
  }

  /**
   * Constrói o contexto compartilhado de execução da Missão Estratégica.
   */
  public buildGoalExecutionContext(goal: StrategicGoal): GoalExecutionContext {
    const activeTask = goal.tasks.find(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_APPROVAL' || t.status === 'PENDING');
    const kpisSummary = goal.definition.metrics.map(m => `${m.name}: ${m.currentValue}/${m.targetValue} ${m.unit}`).join('; ');

    return {
      goalId: goal.goalId,
      organizationId: goal.organizationId,
      propertyId: goal.propertyId,
      sessionId: goal.sessionId,
      title: goal.definition.title,
      objective: goal.definition.objective,
      status: goal.status,
      priority: goal.definition.priority,
      activeTaskId: activeTask?.taskId,
      activeTaskTitle: activeTask?.title,
      assignedAgentId: activeTask?.assignedAgentId,
      progressPercent: goal.metrics.progressPercent,
      kpisSummary,
      approvalRequired: goal.status === 'WAITING_APPROVAL' || !!activeTask?.approvalRequired,
      tasksSummary: goal.tasks.map(t => ({
        taskId: t.taskId,
        title: t.title,
        assignedAgentId: t.assignedAgentId,
        status: t.status,
        approvalRequired: t.approvalRequired
      })),
      updatedAt: goal.updatedAt
    };
  }

  /**
   * Sincroniza o estado da missão com a Memória Compartilhada dos Agentes (AgentSharedMemory).
   */
  public syncToSharedMemory(goal: StrategicGoal): void {
    const ctx = this.buildGoalExecutionContext(goal);
    const scope = {
      organizationId: goal.organizationId,
      propertyId: goal.propertyId,
      sessionId: goal.sessionId || `session_${goal.organizationId}_${goal.propertyId}`
    };

    agentSharedMemory.setValue(
      'goalExecutionContext',
      ctx,
      'goal_engine',
      scope,
      1000 * 60 * 60 * 24
    );

    const activeGoals = this.listGoals({
      organizationId: goal.organizationId,
      propertyId: goal.propertyId
    }).filter(g => ['CREATED', 'PLANNED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'VALIDATING'].includes(g.status));

    agentSharedMemory.setValue(
      'activeGoals',
      activeGoals.map(g => this.buildGoalExecutionContext(g)),
      'goal_engine',
      scope,
      1000 * 60 * 60 * 24
    );
  }

  /**
   * Salva o Goal no repositório central e sincroniza com a memória compartilhada.
   */
  private persistAndSync(goal: StrategicGoal): void {
    goalRegistry.saveGoal(goal);
    this.syncToSharedMemory(goal);
  }

  /**
   * Cria uma nova Missão Estratégica (Goal) no estado CREATED com deduplicação para evitar missões concorrentes idênticas.
   */
  public createGoal(params: CreateGoalParams): StrategicGoal {
    const { definition: customDef, templateId, organizationId, propertyId, sessionId, actor = 'Operator' } = params;

    let definition: GoalDefinition;
    if (customDef) {
      definition = customDef;
    } else if (templateId) {
      const tmpl = goalRegistry.getTemplate(templateId);
      if (!tmpl) {
        throw new Error(`Template de Goal com ID '${templateId}' não encontrado no Goal Registry.`);
      }
      definition = {
        ...tmpl,
        goalId: `goal_${templateId}_${Date.now()}`
      };
    } else {
      throw new Error("É necessário fornecer uma 'definition' customizada ou um 'templateId' válido.");
    }

    // Deduplicação de missões concorrentes ativas no mesmo escopo
    const existingActive = goalRegistry.listGoals({
      organizationId,
      propertyId
    }).find(g => {
      const isSameTemplate = templateId && g.definition.goalId.includes(templateId);
      const isSameTitle = customDef && g.definition.title === customDef.title;
      const isActive = ['CREATED', 'PLANNED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'VALIDATING'].includes(g.status);
      return (isSameTemplate || isSameTitle) && isActive;
    });

    if (existingActive) {
      logger.info(`[GoalEngine] Missão ativa reutilizada (deduplicação): '${existingActive.goalId}'`, { goalId: existingActive.goalId }, 'GOAL_ENGINE');
      return existingActive;
    }

    const now = new Date().toISOString();
    const goal: StrategicGoal = {
      goalId: definition.goalId,
      organizationId,
      propertyId,
      sessionId,
      definition,
      status: 'CREATED',
      tasks: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        pendingTasks: 0,
        progressPercent: 0,
        kpiProgress: {},
        totalExecutionTimeMs: 0
      },
      timeline: [],
      eventLog: [],
      auditTrail: [],
      createdAt: now,
      updatedAt: now
    };

    goalProgressTracker.recordTimelineEntry(goal, 'CREATED', `Missão Estratégica '${definition.title}' criada.`, actor);
    goalProgressTracker.recordAuditTrail(goal, 'GOAL_CREATED', actor, { definition });

    agentEventBus.publishEvent({
      eventName: 'goal:created',
      publisherAgentId: 'goal_engine',
      organizationId,
      propertyId,
      sessionId,
      payload: { goalId: goal.goalId, title: definition.title, priority: definition.priority }
    });

    this.persistAndSync(goal);
    logger.info(`[GoalEngine] Missão Estratégica '${goal.goalId}' criada com sucesso.`, { goalId: goal.goalId }, 'GOAL_ENGINE');

    return goal;
  }

  /**
   * Planeja e decompõe uma Missão Estratégica em tarefas sequenciadas.
   */
  public planGoal(goalId: string, actor: string = 'SystemPlanner'): StrategicGoal {
    const goal = goalRegistry.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal com ID '${goalId}' não encontrado.`);
    }

    goalStateMachine.validateTransition(goal.status, 'PLANNED');

    const plannerResult = goalPlanner.decomposeGoal(goal.definition);
    goal.plannerOutput = plannerResult;
    goal.tasks = plannerResult.decomposedTasks;
    goal.status = 'PLANNED';
    goal.updatedAt = new Date().toISOString();

    goal.metrics = goalProgressTracker.recalculateMetrics(goal);
    goalProgressTracker.recordTimelineEntry(goal, 'PLANNED', `Missão planejada: ${plannerResult.rationale}`, actor);
    goalProgressTracker.recordAuditTrail(goal, 'GOAL_PLANNED', actor, { totalTasks: goal.tasks.length, rationale: plannerResult.rationale });

    agentEventBus.publishEvent({
      eventName: 'goal:planned',
      publisherAgentId: 'goal_engine',
      organizationId: goal.organizationId,
      propertyId: goal.propertyId,
      sessionId: goal.sessionId,
      payload: { goalId: goal.goalId, totalTasks: goal.tasks.length }
    });

    this.persistAndSync(goal);
    return goal;
  }

  /**
   * Executa incrementalmente as tarefas de uma Missão Estratégica até a conclusão ou pausa por aprovação (ADR-005).
   */
  public async executeGoal(goalId: string, actor: string = 'GoalEngine'): Promise<StrategicGoal> {
    let goal = goalRegistry.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal com ID '${goalId}' não encontrado.`);
    }

    if (goal.status === 'CREATED') {
      goal = this.planGoal(goalId, actor);
    }

    // Processar tarefas sequencialmente enquanto houver tarefas executáveis sem bloqueio de aprovação
    let previousStatus: GoalStatus;
    do {
      previousStatus = goal.status;
      goal = await goalExecutor.executeNextTask(goal, actor);
      this.persistAndSync(goal);

      // Se entrou em WAITING_APPROVAL, PAUSED, COMPLETED ou FAILED, interrompe o loop automático
      if (
        goal.status === 'WAITING_APPROVAL' || 
        goal.status === 'PAUSED' || 
        goal.status === 'COMPLETED' || 
        goal.status === 'FAILED' || 
        goal.status === 'ROLLED_BACK'
      ) {
        break;
      }
    } while (goal.status === 'IN_PROGRESS' && goal.status !== previousStatus);

    return goal;
  }

  /**
   * Aprova uma tarefa pausada por instrução ADR-005 e retoma a execução da missão.
   */
  public async approveGoalTask(goalId: string, taskId: string, approverUserId: string): Promise<StrategicGoal> {
    const goal = goalRegistry.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal com ID '${goalId}' não encontrado.`);
    }

    const task = goal.tasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new Error(`Tarefa com ID '${taskId}' não encontrada no Goal '${goalId}'.`);
    }

    if (task.status !== 'WAITING_APPROVAL') {
      throw new Error(`A tarefa '${taskId}' não está aguardando aprovação (Status atual: '${task.status}').`);
    }

    task.status = 'PENDING'; // Liberada para execução
    goalProgressTracker.recordTimelineEntry(
      goal,
      goal.status,
      `Tarefa '${task.title}' aprovada manualmente pelo operador '${approverUserId}'. Liberação concedida (ADR-005).`,
      approverUserId
    );

    goalProgressTracker.recordAuditTrail(
      goal,
      'TASK_APPROVED_BY_HUMAN',
      approverUserId,
      { taskId, title: task.title, approverUserId }
    );

    agentEventBus.publishEvent({
      eventName: 'goal:task_approved',
      publisherAgentId: 'approval_agent',
      organizationId: goal.organizationId,
      propertyId: goal.propertyId,
      sessionId: goal.sessionId,
      payload: { goalId, taskId, approverUserId }
    });

    this.persistAndSync(goal);

    // Retomar execução automática após a concessão da aprovação humana
    return await this.executeGoal(goalId, 'HumanApprover');
  }

  /**
   * Pausa temporariamente uma Missão Estratégica.
   */
  public pauseGoal(goalId: string, reason: string, actor: string = 'Operator'): StrategicGoal {
    const goal = goalRegistry.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal com ID '${goalId}' não encontrado.`);
    }

    goalStateMachine.validateTransition(goal.status, 'PAUSED');
    goal.status = 'PAUSED';
    goal.updatedAt = new Date().toISOString();

    goalProgressTracker.recordTimelineEntry(goal, 'PAUSED', `Missão pausada: ${reason}`, actor);
    goalProgressTracker.recordAuditTrail(goal, 'GOAL_PAUSED', actor, { reason });

    this.persistAndSync(goal);
    return goal;
  }

  /**
   * Executa o plano de rollback de uma Missão Estratégica.
   */
  public rollbackGoal(goalId: string, reason: string, actor: string = 'Operator'): StrategicGoal {
    const goal = goalRegistry.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal com ID '${goalId}' não encontrado.`);
    }

    goalStateMachine.validateTransition(goal.status, 'ROLLED_BACK');
    goal.status = 'ROLLED_BACK';
    goal.updatedAt = new Date().toISOString();

    const rollbackSteps = goal.definition.rollbackPlan.steps;
    goalProgressTracker.recordTimelineEntry(
      goal, 
      'ROLLED_BACK', 
      `Plano de Rollback acionado. Passos executados: [${rollbackSteps.join('; ')}]. Motivo: ${reason}`, 
      actor
    );

    goalProgressTracker.recordAuditTrail(
      goal, 
      'GOAL_ROLLED_BACK', 
      actor, 
      { reason, rollbackSteps }
    );

    agentEventBus.publishEvent({
      eventName: 'goal:rolled_back',
      publisherAgentId: 'goal_engine',
      organizationId: goal.organizationId,
      propertyId: goal.propertyId,
      sessionId: goal.sessionId,
      payload: { goalId, reason, rollbackSteps }
    });

    this.persistAndSync(goal);
    return goal;
  }

  public getGoal(goalId: string): StrategicGoal | null {
    return goalRegistry.getGoal(goalId);
  }

  public listGoals(filter?: { organizationId?: string; propertyId?: string; status?: string }): StrategicGoal[] {
    return goalRegistry.listGoals(filter);
  }
}

export const goalEngine = new GoalEngine();

