export type StrategicPlanStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';

export type StrategicActionType = 
  | 'CREATE_GOAL'
  | 'CANCEL_GOAL'
  | 'PAUSE_GOAL'
  | 'RESUME_GOAL'
  | 'REPRIORITIZE_GOAL'
  | 'KPI_ADJUSTMENT';

export interface KPIEvidence {
  kpiName: string;
  currentValue: number | string;
  targetValue: number | string;
  gap: number | string;
  unit: string;
}

export interface ExpectedImpact {
  metric: string;
  expectedChange: string;
  timeframeDays: number;
}

export interface StrategicRiskItem {
  riskId: string;
  category: 'REVENUE' | 'OCCUPANCY' | 'OPERATIONAL' | 'REPUTATION' | 'FINANCIAL';
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidences: string[];
  mitigationStrategy: string;
}

export interface StrategicAlternative {
  alternativeTitle: string;
  pros: string[];
  cons: string[];
  reasonRejected: string;
}

export interface ExplainableRecommendation {
  recommendationId: string;
  planId: string;
  version: number;
  title: string;
  description: string;
  actionType: StrategicActionType;
  targetGoalTemplateId?: string;
  targetGoalId?: string;
  kpisUsed: KPIEvidence[];
  evidence: string[];
  confidenceScore: number; // 0.00 a 1.00
  expectedImpact: ExpectedImpact;
  risks: StrategicRiskItem[];
  alternativesConsidered: StrategicAlternative[];
  justificationText: string;
  organizationId: string;
  propertyId: string;
  createdAt: string;
}

export interface StrategicSimulationResult {
  simulationId: string;
  planId: string;
  scenarioName: string;
  projectedRevPARChangePercent: number;
  projectedOccupancyChangePercent: number;
  projectedADRChangePercent: number;
  confidenceScore: number;
  recommendedDecision: 'PROCEED_TO_APPROVAL' | 'REJECT_PLAN' | 'REVISE_PARAMETERS';
  simulationSummary: string;
}

export interface PlanAuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  version: number;
}

export interface StrategicPlan {
  planId: string;
  version: number;
  organizationId: string;
  propertyId: string;
  status: StrategicPlanStatus;
  period: string; // Ex: 'Q3-2026' ou 'Mês Corrente'
  title: string;
  executiveSummary: string;
  supersedesPlanId?: string;
  createdBy: string;
  recommendations: ExplainableRecommendation[];
  simulation?: StrategicSimulationResult;
  auditTrail: PlanAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationalKPIsSnapshot {
  organizationId: string;
  propertyId: string;
  occupancyRatePercent: number;
  adr: number;
  revPar: number;
  housekeepingSlaPercent: number;
  directBookingSharePercent: number;
  commercialPipelineValue: number;
  cancelledProposalsCount: number;
  npsScore: number;
  timestamp: string;
}

export interface StrategicAnalysisResult {
  snapshot: OperationalKPIsSnapshot;
  detectedRisks: StrategicRiskItem[];
  detectedOpportunities: Array<{
    opportunityId: string;
    title: string;
    description: string;
    potentialRevenueImpact: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  forecastSummary: {
    thirtyDayRevPARProjection: number;
    thirtyDayOccupancyProjection: number;
    trend: 'UPWARD' | 'STABLE' | 'DOWNWARD';
  };
  priorityFocusAreas: string[];
}
