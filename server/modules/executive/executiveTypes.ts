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

export interface ExecutiveSummaryForAI {
  kpis: {
    totalRevenue: number;
    adr: number;
    revpar: number;
    occupancyRatePercent: number;
    pipelineValue: number;
    retentionRatePercent: number;
    averageLtv: number;
  };
  topDailyPriorities: string[];
  topOperationalRisks: string[];
  topExecutiveAlerts: string[];
}
