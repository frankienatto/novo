import { StrategicGoal, GoalKPI } from './goalTypes.ts';

export interface ValidationResult {
  isSuccess: boolean;
  isFailure: boolean;
  requiresRollback: boolean;
  validationReason: string;
  updatedKPIs: GoalKPI[];
}

export class GoalValidator {
  /**
   * Avalia o atingimento das metas e critérios de um Goal.
   */
  public validateGoalProgress(goal: StrategicGoal): ValidationResult {
    const { definition, tasks } = goal;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const failedTasks = tasks.filter(t => t.status === 'FAILED');

    let allTasksDone = tasks.length > 0 && completedTasks.length === tasks.length;
    let isFailure = failedTasks.length > 0;
    let requiresRollback = false;

    // Avaliar progresso de KPIs
    const updatedKPIs = definition.metrics.map(kpi => {
      // Simulação ou extração das métricas atuais das respostas das tarefas executadas
      let latestVal = kpi.currentValue;
      for (const t of completedTasks) {
        if (t.resultData && typeof t.resultData === 'object') {
          if (t.resultData[kpi.kpiId] !== undefined) {
            latestVal = Number(t.resultData[kpi.kpiId]);
          }
        }
      }

      return {
        ...kpi,
        currentValue: latestVal
      };
    });

    // Verificar se todas as métricas atingiram a meta
    const allKPIsMet = updatedKPIs.every(kpi => {
      if (kpi.targetValue >= kpi.currentValue) {
        // Se a meta é um limite superior ou progresso direto
        return kpi.currentValue >= kpi.targetValue * 0.9; // 90% de tolerância para sucesso
      } else {
        // Se a meta é redução (ex: SLA de minutos)
        return kpi.currentValue <= kpi.targetValue * 1.1;
      }
    });

    const isSuccess = allTasksDone && allKPIsMet && !isFailure;

    if (isFailure) {
      // Se houve falha crítica e o plano de rollback contiver gatilhos atingidos
      requiresRollback = definition.rollbackPlan.steps.length > 0;
    }

    let validationReason = "";
    if (isSuccess) {
      validationReason = `Missão com todos os critérios de sucesso atendidos. ${completedTasks.length}/${tasks.length} tarefas concluídas.`;
    } else if (isFailure) {
      validationReason = `Falha identificada em ${failedTasks.length} tarefa(s). Avaliando necessidade de acionamento do plano de rollback.`;
    } else {
      validationReason = `Em progresso: ${completedTasks.length}/${tasks.length} tarefas concluídas. KPIs atualizados.`;
    }

    return {
      isSuccess,
      isFailure,
      requiresRollback,
      validationReason,
      updatedKPIs
    };
  }
}

export const goalValidator = new GoalValidator();
