export type PlaybookStatus = 
  | 'planned'
  | 'in_manual_execution'
  | 'completed_manually'
  | 'cancelled'
  | 'blocked';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ResponsibleArea = 
  | 'revenue'
  | 'marketing'
  | 'sales'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'management'
  | 'general';

export interface ChecklistItem {
  stepId: string;
  title: string;
  description: string;
  assignedTo?: string;
  completed: boolean;
  manualInstruction: string;
}

export interface OperationalPlaybook {
  playbookId: string;
  title: string;
  description: string;
  objective: string;
  originRecommendation: any;
  priority: PriorityLevel;
  estimatedDuration: string;
  estimatedComplexity: 'low' | 'medium' | 'high' | 'critical';
  estimatedBusinessImpact: string;
  responsibleArea: ResponsibleArea;
  recommendedOwner: string;
  requiredResources: string[];
  dependencies: string[];
  checklist: ChecklistItem[];
  executionSteps: string[];
  risks: string[];
  expectedOutcome: string;
  approvalReference?: any;
  status: PlaybookStatus;
  executionMode: 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface PlanningDashboard {
  totalPlansCreated: number;
  pendingPlansCount: number;
  inManualExecutionCount: number;
  completedManuallyCount: number;
  averageEstimatedDurationMinutes: number;
  distributionBySector: Record<string, number>;
  distributionByPriority: Record<string, number>;
  topBottlenecks: string[];
  topOpportunities: string[];
  activePlaybooks: OperationalPlaybook[];
  systemStatus: 'read_only_planning';
}

export interface PlanningSummaryForAI {
  plannedActions: number;
  highPriorityPlans: number;
  estimatedExecutionHours: number;
  criticalDependencies: string;
  topPlaybook: string;
}
