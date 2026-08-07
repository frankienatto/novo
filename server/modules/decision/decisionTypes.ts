export type RecommendationSourceModule = 
  | 'executive_copilot'
  | 'executive'
  | 'revenue'
  | 'marketing'
  | 'sales'
  | 'direct_booking'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'pms';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationImpact = 'high' | 'medium' | 'low';
export type RecommendationRisk = 'high' | 'medium' | 'low';
export type RecommendationStatus = 'pending_approval' | 'approved' | 'rejected';

export interface DecisionRecommendation {
  recommendationId: string;
  title: string;
  description: string;
  reason: string;
  sourceModule: RecommendationSourceModule;
  priority: RecommendationPriority;
  impact: RecommendationImpact;
  risk: RecommendationRisk;
  confidence: number; // 0 - 100
  estimatedBenefit: string;
  estimatedEffort: string;
  recommendedOwner: string;
  dependencies: string[];
  approvalRequired: boolean; // Sempre true
  status: RecommendationStatus; // Sempre 'pending_approval'
  createdAt: string;
}

export interface DecisionDashboard {
  totalPendingRecommendations: number;
  criticalRecommendationsCount: number;
  confidenceAverage: number;
  highestPriorityAction: string;
  executiveActionQueue: DecisionRecommendation[];
  dailyPriorities: string[];
  criticalBottlenecks: string[];
  quickWins: DecisionRecommendation[];
  categorizedRecommendations: {
    strategic: DecisionRecommendation[];
    operational: DecisionRecommendation[];
    commercial: DecisionRecommendation[];
    marketing: DecisionRecommendation[];
    housekeeping: DecisionRecommendation[];
    maintenance: DecisionRecommendation[];
  };
  calculatedAt: string;
}

export interface DecisionSummaryForAI {
  totalRecommendations: number;
  criticalRecommendations: number;
  highestPriority: string;
  nextRecommendedAction: string;
  confidenceAverage: number;
}
