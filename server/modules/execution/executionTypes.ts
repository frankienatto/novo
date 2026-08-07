export type ExecutionStatus = 
  | 'waiting_execution'
  | 'running'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export interface ExecutionRecord {
  executionId: string;
  playbookId: string;
  title: string;
  status: ExecutionStatus;
  progressPercent: number;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
  owner: string;
  sector: string;
  estimatedDuration: string;
  actualDuration?: string;
  blocked: boolean;
  blockReason?: string;
  dependencies: string[];
  completedChecklist: string[];
  remainingChecklist: string[];
  manualNotes?: string;
  executionMode: 'manual';
  createdAt: string;
}

export interface ExecutionDashboard {
  waitingCount: number;
  runningCount: number;
  completedCount: number;
  blockedCount: number;
  averageExecutionTimeMinutes: number;
  deviations: string[];
  bottlenecks: string[];
  productivityBySector: Record<string, number>;
  productivityByOwner: Record<string, number>;
  delayedPlaybooks: ExecutionRecord[];
  executions: ExecutionRecord[];
  systemStatus: 'read_only_tracking';
}

export interface ExecutionSummaryForAI {
  waiting: number;
  running: number;
  completed: number;
  blocked: number;
  averageProgress: number;
  criticalExecutions: string;
}
