export interface ExecutiveKpis {
  revenue: {
    totalRevenue: number;
    adr: number;
    revpar: number;
    occupancyRatePercent: number;
    pickupCount: number;
    bookingPacePercent: number;
  };
  commercial: {
    pipelineValue: number;
    openOpportunitiesCount: number;
    proposalsCount: number;
    conversionRatePercent: number;
  };
  retentionAndMarketing: {
    retentionRatePercent: number;
    repeatGuestRatioPercent: number;
    averageLtv: number;
    topPerformingChannel: string;
  };
  operations: {
    pendingCheckInsCount: number;
    pendingCheckOutsCount: number;
    inHouseCount: number;
    pendingCleaningsCount: number;
    urgentCleaningsCount: number;
    pendingMaintenanceCount: number;
    criticalMaintenanceCount: number;
  };
}

export interface ExecutiveAlert {
  alertId: string;
  category: 'operational' | 'commercial' | 'financial' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
}

export interface ExecutivePriorities {
  dailyPriorities: string[];
  operationalRisks: string[];
  commercialOpportunities: string[];
  revenueOpportunities: string[];
  marketingOpportunities: string[];
}

export interface ExecutiveSummaryModule {
  operationalToday: string;
  commercialSummary: string;
  financialAnalyticalSummary: string;
  receptionSummary: string;
  housekeepingSummary: string;
  maintenanceSummary: string;
  marketingSummary: string;
  salesSummary: string;
}

export interface ExecutiveDashboard {
  kpis: ExecutiveKpis;
  alerts: ExecutiveAlert[];
  priorities: ExecutivePriorities;
  summary: ExecutiveSummaryModule;
  generatedAt: string;
}

export interface HealthScoreBreakdown {
  overallScore: number;
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
  impactScore: number;
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
  riskScore: number;
  opportunityScore: number;
  topRisks: ExecutiveRisk[];
  topOpportunities: ExecutiveOpportunity[];
  recommendedPriorities: string[];
  operationalBottlenecks: string[];
  strategicTrends: string[];
  strategicRecommendations: string[];
  dailyBrief: ExecutiveDailyBrief;
  calculatedAt: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  content: string;
  timestamp: string;
  status?: 'thinking' | 'typing' | 'done' | 'error' | 'offline';
  cards?: {
    type: 'recommendation' | 'risk' | 'opportunity' | 'kpi';
    title: string;
    description: string;
    badgeText?: string;
    badgeVariant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
    kpiValue?: string;
  }[];
}

export interface CopilotSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}
