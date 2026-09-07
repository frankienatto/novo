export type OperationalModuleTarget = 
  | 'pms'
  | 'reservations'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'revenue'
  | 'sales'
  | 'direct_booking'
  | 'marketing'
  | 'executive';

export type ContextualInsightType = 
  | 'INSIGHT'
  | 'ALERT'
  | 'RECOMMENDATION'
  | 'GOAL_CONTEXT'
  | 'STRATEGIC_OPPORTUNITY';

export type ContextualPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ContextualStatus = 'ACTIVE' | 'EXPIRED' | 'ACKNOWLEDGED' | 'DISMISSED' | 'PENDING_APPROVAL';

export type ContextualSource = 
  | 'strategic_planning'
  | 'goal_engine'
  | 'strategic_impact'
  | 'executive_brain'
  | 'agent_orchestrator'
  | 'closed_loop'
  | 'system';

export interface ExpectedImpactSummary {
  metric: string;
  expectedChange: string;
  confidence: number;
}

export interface ActualImpactSummary {
  outcome: string;
  achievementRatePercent: number;
}

export interface ContextualInsight {
  insightId: string;
  organizationId: string;
  propertyId: string;
  targetModules: OperationalModuleTarget[];
  source: ContextualSource;
  type: ContextualInsightType;
  priority: ContextualPriority;
  confidence: number;
  title: string;
  summary: string;
  description?: string;
  goalId?: string;
  planId?: string;
  recommendationId?: string;
  expectedImpact?: ExpectedImpactSummary;
  actualImpact?: ActualImpactSummary;
  status: ContextualStatus;
  requiresApproval: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface CreateInsightParams {
  organizationId: string;
  propertyId: string;
  targetModules: OperationalModuleTarget[];
  source: ContextualSource;
  type: ContextualInsightType;
  priority: ContextualPriority;
  confidence: number;
  title: string;
  summary: string;
  description?: string;
  goalId?: string;
  planId?: string;
  recommendationId?: string;
  expectedImpact?: ExpectedImpactSummary;
  actualImpact?: ActualImpactSummary;
  requiresApproval?: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface ModuleContextFilter {
  organizationId: string;
  propertyId: string;
  module: OperationalModuleTarget;
  minPriority?: ContextualPriority;
  minConfidence?: number;
  includeExpired?: boolean;
  includePendingApproval?: boolean;
  goalId?: string;
  type?: ContextualInsightType;
  limit?: number;
}

export interface ModuleContextSummary {
  module: OperationalModuleTarget;
  organizationId: string;
  propertyId: string;
  activeInsightsCount: number;
  criticalAlertsCount: number;
  pendingRecommendationsCount: number;
  topInsights: ContextualInsight[];
  relatedGoals: string[];
  lastUpdatedAt: string;
}
