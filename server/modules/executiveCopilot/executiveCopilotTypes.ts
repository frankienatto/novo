export interface HealthScoreBreakdown {
  overallScore: number; // 0 - 100
  revenueHealth: number;
  commercialHealth: number;
  marketingHealth: number;
  salesHealth: number;
  operationalHealth: number;
  guestExperienceHealth: number;
  housekeepingHealth: number;
  maintenanceHealth: number;
}

export interface ExecutiveRisk {
  riskId: string;
  category: 'financial' | 'operational' | 'commercial' | 'maintenance' | 'reputation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impactScore: number; // 1 - 10
  mitigationStrategy: string;
}

export interface ExecutiveOpportunity {
  opportunityId: string;
  category: 'revenue' | 'direct_booking' | 'upsell' | 'marketing' | 'efficiency';
  title: string;
  description: string;
  potentialImpact: string;
  actionableSteps: string[];
}

export interface ExecutiveDailyBrief {
  summary: string;
  primaryFocusArea: string;
  keyAlertCount: number;
  strategicTakeaway: string;
}

export interface ExecutiveCopilotDashboard {
  healthScores: HealthScoreBreakdown;
  riskScore: number; // 0 - 100
  opportunityScore: number; // 0 - 100
  topRisks: ExecutiveRisk[]; // Top 10
  topOpportunities: ExecutiveOpportunity[]; // Top 10
  recommendedPriorities: string[];
  operationalBottlenecks: string[];
  strategicTrends: string[];
  strategicRecommendations: string[];
  dailyBrief: ExecutiveDailyBrief;
  calculatedAt: string;
}

export interface ExecutiveCopilotSummaryForAI {
  healthScore: number;
  riskScore: number;
  opportunityScore: number;
  topRisks: string[]; // max 5
  topOpportunities: string[]; // max 5
  topPriorities: string[]; // max 5
  executiveBrief: string;
}
