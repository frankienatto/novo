export type GoalStatus = 
  | 'CREATED'
  | 'PLANNED'
  | 'WAITING_APPROVAL'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type GoalPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'PENDING' | 'WAITING_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface GoalKPI {
  kpiId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface GoalRisk {
  riskId: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigationPlan: string;
}

export interface GoalRollbackPlan {
  steps: string[];
  triggerConditions: string[];
  automated: boolean;
}

export interface GoalTask {
  taskId: string;
  title: string;
  description: string;
  assignedAgentId: string;
  requiredContext: string[];
  expectedEvents: string[];
  expectedOutcome: string;
  status: TaskStatus;
  resultText?: string;
  resultData?: any;
  executedAt?: string;
  executionTimeMs?: number;
  approvalRequired?: boolean;
}

export interface GoalDefinition {
  goalId: string;
  title: string;
  objective: string;
  metrics: GoalKPI[];
  deadlineDays: number;
  priority: GoalPriority;
  relatedKPIs: string[];
  involvedAgents: string[];
  dependencies: string[];
  successCriteria: string[];
  failureCriteria: string[];
  risks: GoalRisk[];
  rollbackPlan: GoalRollbackPlan;
}

export interface GoalTimelineEntry {
  timestamp: string;
  status: GoalStatus;
  message: string;
  triggeredBy: string;
}

export interface GoalEventLog {
  eventId: string;
  goalId: string;
  eventName: string;
  timestamp: string;
  agentId?: string;
  payload: Record<string, any>;
}

export interface GoalAuditTrailEntry {
  auditId: string;
  goalId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface GoalMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  progressPercent: number;
  kpiProgress: Record<string, number>;
  totalExecutionTimeMs: number;
}

export interface StrategicGoal {
  goalId: string;
  organizationId: string;
  propertyId: string;
  sessionId?: string;
  definition: GoalDefinition;
  status: GoalStatus;
  plannerOutput?: {
    decomposedTasks: GoalTask[];
    rationale: string;
  };
  tasks: GoalTask[];
  metrics: GoalMetrics;
  timeline: GoalTimelineEntry[];
  eventLog: GoalEventLog[];
  auditTrail: GoalAuditTrailEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GoalExecutionContext {
  goalId: string;
  organizationId: string;
  propertyId: string;
  sessionId?: string;
  title: string;
  objective: string;
  status: GoalStatus;
  priority: GoalPriority;
  activeTaskId?: string;
  activeTaskTitle?: string;
  assignedAgentId?: string;
  progressPercent: number;
  kpisSummary: string;
  approvalRequired: boolean;
  tasksSummary: Array<{
    taskId: string;
    title: string;
    assignedAgentId: string;
    status: TaskStatus;
    approvalRequired?: boolean;
  }>;
  updatedAt: string;
}
