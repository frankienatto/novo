import { StrategicGoal, GoalTask } from './goalTypes.ts';
import { synapseAgentOrchestrator } from '../orchestrator/synapseAgentOrchestrator.ts';
import { goalStateMachine } from './goalStateMachine.ts';
import { goalProgressTracker } from './goalProgressTracker.ts';
import { goalValidator } from './goalValidator.ts';
import { logger } from '../../../utils/logger.ts';

export class GoalExecutor {
  /**
   * Executa a próxima tarefa pendente do Goal.
   * Respeita ADR-005: Pausa para aprovação humana quando 'approvalRequired' for verdadeiro.
   */
  public async executeNextTask(goal: StrategicGoal, actor: string = 'SystemGoalExecutor'): Promise<StrategicGoal> {
    // 1. Localizar próxima tarefa pendente ou em espera
    const nextTask = goal.tasks.find(t => t.status === 'PENDING' || t.status === 'WAITING_APPROVAL');

    if (!nextTask) {
      // Nenhuma tarefa pendente. Mudar estado para VALIDATING
      if (goalStateMachine.canTransition(goal.status, 'VALIDATING')) {
        goalStateMachine.validateTransition(goal.status, 'VALIDATING');
        goal.status = 'VALIDATING';
        goalProgressTracker.recordTimelineEntry(goal, 'VALIDATING', 'Todas as tarefas concluídas. Iniciando validação de critérios de sucesso.', actor);
      }

      // Validar critérios do Goal
      const valResult = goalValidator.validateGoalProgress(goal);
      if (valResult.isSuccess) {
        if (goalStateMachine.canTransition(goal.status, 'COMPLETED')) {
          goalStateMachine.validateTransition(goal.status, 'COMPLETED');
          goal.status = 'COMPLETED';
          goal.completedAt = new Date().toISOString();
          goalProgressTracker.recordTimelineEntry(goal, 'COMPLETED', `Missão concluída com sucesso! ${valResult.validationReason}`, actor);
          goalProgressTracker.recordAuditTrail(goal, 'GOAL_COMPLETED', actor, { validationReason: valResult.validationReason });
        }
      } else if (valResult.isFailure) {
        if (goalStateMachine.canTransition(goal.status, 'FAILED')) {
          goalStateMachine.validateTransition(goal.status, 'FAILED');
          goal.status = 'FAILED';
          goalProgressTracker.recordTimelineEntry(goal, 'FAILED', `Falha nos critérios da missão: ${valResult.validationReason}`, actor);
          goalProgressTracker.recordAuditTrail(goal, 'GOAL_FAILED', actor, { validationReason: valResult.validationReason });
        }
      }

      goal.metrics = goalProgressTracker.recalculateMetrics(goal);
      return goal;
    }

    // 2. Verificar ADR-005: Exigência de aprovação humana
    if (nextTask.approvalRequired && nextTask.status !== 'WAITING_APPROVAL' && actor !== 'HumanApprover') {
      nextTask.status = 'WAITING_APPROVAL';

      if (goal.status !== 'WAITING_APPROVAL' && goalStateMachine.canTransition(goal.status, 'WAITING_APPROVAL')) {
        goalStateMachine.validateTransition(goal.status, 'WAITING_APPROVAL');
        goal.status = 'WAITING_APPROVAL';
      }

      goalProgressTracker.recordTimelineEntry(
        goal, 
        'WAITING_APPROVAL', 
        `Pausa por instrução ADR-005: A tarefa '${nextTask.title}' requer aprovação humana explícita do operador para execução.`, 
        actor
      );

      goalProgressTracker.recordEventLog(
        goal, 
        'goal:task_waiting_approval', 
        { taskId: nextTask.taskId, title: nextTask.title, assignedAgentId: nextTask.assignedAgentId }, 
        nextTask.assignedAgentId
      );

      goalProgressTracker.recordAuditTrail(
        goal, 
        'TASK_APPROVAL_REQUESTED', 
        actor, 
        { taskId: nextTask.taskId, assignedAgentId: nextTask.assignedAgentId }
      );

      goal.metrics = goalProgressTracker.recalculateMetrics(goal);
      return goal;
    }

    // 3. Execução da Tarefa via SynapseAgentOrchestrator
    if (goal.status !== 'IN_PROGRESS' && goalStateMachine.canTransition(goal.status, 'IN_PROGRESS')) {
      goalStateMachine.validateTransition(goal.status, 'IN_PROGRESS');
      goal.status = 'IN_PROGRESS';
      goalProgressTracker.recordTimelineEntry(goal, 'IN_PROGRESS', `Iniciando execução da missão '${goal.definition.title}'.`, actor);
    }

    nextTask.status = 'IN_PROGRESS';
    const taskStartTime = Date.now();

    goalProgressTracker.recordEventLog(
      goal,
      'goal:task_started',
      { taskId: nextTask.taskId, title: nextTask.title, assignedAgentId: nextTask.assignedAgentId },
      nextTask.assignedAgentId
    );

    try {
      const orchResult = await synapseAgentOrchestrator.execute({
        prompt: `[EXECUÇÃO DE TAREFA DE MISSÃO ESTRATÉGICA]
Goal ID: ${goal.goalId}
Título da Missão: ${goal.definition.title}
Objetivo Principal: ${goal.definition.objective}
Métricas Alvo: ${goal.definition.metrics.map(m => `${m.name}: ${m.targetValue}${m.unit}`).join(', ')}

TAREFA ATUAL:
ID: ${nextTask.taskId}
Título: ${nextTask.title}
Descrição: ${nextTask.description}
Resultado Esperado: ${nextTask.expectedOutcome}

Por favor, execute este passo fornecendo uma resposta analítica clara com ações/recomendações aplicáveis.`,
        agentId: nextTask.assignedAgentId,
        organizationId: goal.organizationId,
        propertyId: goal.propertyId,
        sessionId: goal.sessionId,
        priority: goal.definition.priority
      });

      nextTask.status = 'COMPLETED';
      nextTask.resultText = orchResult.text;
      nextTask.resultData = orchResult.data;
      nextTask.executedAt = new Date().toISOString();
      nextTask.executionTimeMs = Date.now() - taskStartTime;

      goalProgressTracker.recordEventLog(
        goal,
        'goal:task_completed',
        { 
          taskId: nextTask.taskId, 
          assignedAgentId: nextTask.assignedAgentId, 
          executionTimeMs: nextTask.executionTimeMs 
        },
        nextTask.assignedAgentId
      );

      goalProgressTracker.recordAuditTrail(
        goal,
        'TASK_COMPLETED',
        actor,
        { taskId: nextTask.taskId, assignedAgentId: nextTask.assignedAgentId, executionTimeMs: nextTask.executionTimeMs }
      );

      logger.info(
        `[GoalExecutor] Tarefa '${nextTask.title}' concluída com sucesso para o Goal '${goal.goalId}'`,
        { goalId: goal.goalId, taskId: nextTask.taskId, assignedAgentId: nextTask.assignedAgentId },
        'GOAL_EXECUTOR'
      );

    } catch (taskError: any) {
      nextTask.status = 'FAILED';
      nextTask.executedAt = new Date().toISOString();
      nextTask.executionTimeMs = Date.now() - taskStartTime;
      nextTask.resultText = `Erro na execução da tarefa: ${taskError?.message || taskError}`;

      goalProgressTracker.recordEventLog(
        goal,
        'goal:task_failed',
        { taskId: nextTask.taskId, error: taskError?.message || String(taskError) },
        nextTask.assignedAgentId
      );

      goalProgressTracker.recordAuditTrail(
        goal,
        'TASK_FAILED',
        actor,
        { taskId: nextTask.taskId, error: taskError?.message || String(taskError) }
      );

      logger.error(
        `[GoalExecutor] Falha na execução da tarefa '${nextTask.title}' do Goal '${goal.goalId}'`,
        { error: taskError?.message || String(taskError), goalId: goal.goalId, taskId: nextTask.taskId },
        'GOAL_EXECUTOR'
      );
    }

    goal.metrics = goalProgressTracker.recalculateMetrics(goal);
    goal.updatedAt = new Date().toISOString();

    return goal;
  }
}

export const goalExecutor = new GoalExecutor();
