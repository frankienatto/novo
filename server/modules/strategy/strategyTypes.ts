export type ScenarioType =
  | 'adr_increase'
  | 'cancellation_reduction'
  | 'conversion_increase'
  | 'occupancy_increase'
  | 'retention_increase'
  | 'direct_booking_increase'
  | 'housekeeping_time_reduction'
  | 'maintenance_backlog_reduction'
  | 'lead_time_improvement'
  | 'booking_pace_improvement'
  | 'custom';

export interface ExplainableAiDetails {
  reasoning: string;
  evidence: string[];
  confidenceScore: number; // 0 a 100
  estimatedGain: string;
  estimatedRisk: 'low' | 'medium' | 'high' | string;
  businessImpact: string;
  operationalImpact: string;
  financialImpact: string;
  affectedModules: string[];
  dependencies: string[];
  humanApprovalRequired: true;
  approvalRequired: true;
  status: 'simulation_only';
}

export interface ScenarioMetrics {
  adr: number;
  occupancyRate: number;
  revpar: number;
  monthlyRevenue: number;
  conversionRate: number;
  cancellationRate: number;
  directBookingShare: number;
  avgHousekeepingTimeMinutes: number;
  maintenanceBacklogCount: number;
  leadTimeDays: number;
  bookingPaceIndex: number;
  [key: string]: any;
}

export interface SimulationScenario {
  scenarioId: string;
  type: ScenarioType;
  title: string;
  description: string;
  currentScenario: ScenarioMetrics;
  projectedScenario: ScenarioMetrics;
  financialImpact: {
    estimatedMonthlyGain: number;
    estimatedAnnualGain: number;
    gainPercent: number;
    description: string;
  };
  operationalImpact: {
    description: string;
    effortLevel: 'low' | 'medium' | 'high';
    workloadChange: string;
  };
  commercialImpact: {
    description: string;
    expectedSalesLiftPercent: number;
    channelImpact: string;
  };
  confidence: number; // 0 a 100
  assumptions: string[];
  risks: string[];
  benefits: string[];
  limitations: string[];
  dependencies: string[];
  explainableAi: ExplainableAiDetails;
  humanApprovalRequired: true;
  approvalRequired: true;
  status: 'simulation_only';
  createdAt: string;
}

export interface SimulationParams {
  scenarioType?: ScenarioType;
  adrIncreasePercent?: number;
  cancellationReductionPercent?: number;
  conversionIncreasePercent?: number;
  occupancyIncreasePercent?: number;
  retentionIncreasePercent?: number;
  directBookingIncreasePercent?: number;
  housekeepingTimeReductionPercent?: number;
  maintenanceBacklogReductionPercent?: number;
  leadTimeImprovementDays?: number;
  bookingPaceImprovementPercent?: number;
  customName?: string;
}

export interface StrategyDashboard {
  activeScenariosCount: number;
  topScenarios: SimulationScenario[];
  highestImpactScenario: SimulationScenario | null;
  highestConfidenceScenario: SimulationScenario | null;
  averageConfidence: number;
  topRecommendation: string;
  overallFinancialPotential: {
    estimatedMonthlyGainTotal: number;
    estimatedAnnualGainTotal: number;
  };
  systemStatus: 'read_only';
  simulationMode: 'memory_only';
}

export interface StrategySummaryForAI {
  totalScenarios: number;
  highestImpactScenario: string;
  highestConfidenceScenario: string;
  topRecommendation: string;
  averageConfidence: number;
}
