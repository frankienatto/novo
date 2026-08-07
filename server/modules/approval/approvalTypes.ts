export type ApprovalStatus = 
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'implemented_manually';

export type ModuleOrigin =
  | 'executive_copilot'
  | 'executive'
  | 'decision_engine'
  | 'strategic_simulation'
  | 'revenue'
  | 'marketing'
  | 'sales'
  | 'direct_booking'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'pms';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ApprovalRecord {
  approvalId: string;
  recommendationId: string;
  title: string;
  description: string;
  decisionBy: string;
  decisionDate: string;
  reason: string;
  comments: string;
  status: ApprovalStatus;
  priority: PriorityLevel;
  originalRecommendation: any;
  moduleOrigin: ModuleOrigin | string;
  correlationId: string;
  requestId: string;
  organizationId: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDashboard {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  implementedManuallyCount: number;
  averageApprovalTimeMinutes: number;
  averageResponseTimeHours: number;
  backlogCount: number;
  distributionByModule: Record<string, number>;
  distributionByPriority: Record<string, number>;
  pendingItems: ApprovalRecord[];
  recentHistory: ApprovalRecord[];
  systemStatus: 'read_only_governance';
}

export interface ApprovalSummaryForAI {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: string;
  oldestPending: string;
}

export interface ActionDecisionParams {
  recommendationId: string;
  decisionBy?: string;
  reason?: string;
  comments?: string;
  organizationId?: string;
  propertyId?: string;
}
