import { 
  StrategicGoal, 
  GoalStatus, 
  GoalMetrics, 
  GoalTimelineEntry, 
  GoalEventLog, 
  GoalAuditTrailEntry 
} from './goalTypes.ts';

export class GoalProgressTracker {
  /**
   * Recalcula o progresso e métricas consolidadas do Goal.
   */
  public recalculateMetrics(goal: StrategicGoal): GoalMetrics {
    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter(t => t.status === 'COMPLETED').length;
    const failedTasks = goal.tasks.filter(t => t.status === 'FAILED').length;
    const pendingTasks = goal.tasks.filter(t => t.status === 'PENDING' || t.status === 'WAITING_APPROVAL' || t.status === 'IN_PROGRESS').length;

    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalExecutionTimeMs = goal.tasks.reduce((acc, t) => acc + (t.executionTimeMs || 0), 0);

    const kpiProgress: Record<string, number> = {};
    for (const kpi of goal.definition.metrics) {
      if (kpi.targetValue > 0) {
        kpiProgress[kpi.kpiId] = Math.min(100, Math.round((kpi.currentValue / kpi.targetValue) * 100));
      } else {
        kpiProgress[kpi.kpiId] = 100;
      }
    }

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      progressPercent,
      kpiProgress,
      totalExecutionTimeMs
    };
  }

  /**
   * Adiciona entrada na linha do tempo (Goal Timeline).
   */
  public recordTimelineEntry(
    goal: StrategicGoal,
    status: GoalStatus,
    message: string,
    triggeredBy: string = 'GoalEngine'
  ): GoalTimelineEntry {
    const entry: GoalTimelineEntry = {
      timestamp: new Date().toISOString(),
      status,
      message,
      triggeredBy
    };
    goal.timeline.push(entry);
    return entry;
  }

  /**
   * Registra evento no Goal Event Log.
   */
  public recordEventLog(
    goal: StrategicGoal,
    eventName: string,
    payload: Record<string, any>,
    agentId?: string
  ): GoalEventLog {
    const eventLog: GoalEventLog = {
      eventId: `gevt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      goalId: goal.goalId,
      eventName,
      timestamp: new Date().toISOString(),
      agentId,
      payload
    };
    goal.eventLog.push(eventLog);
    return eventLog;
  }

  /**
   * Registra entrada de auditoria imutável (Goal Audit Trail).
   */
  public recordAuditTrail(
    goal: StrategicGoal,
    action: string,
    actor: string,
    details: Record<string, any>
  ): GoalAuditTrailEntry {
    const auditEntry: GoalAuditTrailEntry = {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      goalId: goal.goalId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details
    };
    goal.auditTrail.push(auditEntry);
    return auditEntry;
  }
}

export const goalProgressTracker = new GoalProgressTracker();
