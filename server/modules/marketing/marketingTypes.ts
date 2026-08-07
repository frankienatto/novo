export type MarketingSegmentType = 
  | 'vip'
  | 'recurring'
  | 'first_stay'
  | 'corporate'
  | 'long_stay'
  | 'families'
  | 'couples'
  | 'international'
  | 'blacklist'
  | 'birthday_month'
  | 'inactive';

export type JourneyStage = 
  | 'lead'
  | 'inquiry'
  | 'opportunity'
  | 'proposal'
  | 'official_reservation'
  | 'check_in'
  | 'in_house'
  | 'check_out'
  | 'return_guest'
  | 'churned'
  | 'recovered';

export interface MarketingSegmentSummary {
  segment: MarketingSegmentType;
  label: string;
  count: number;
  percentageOfTotal: number;
  averageLtv: number;
}

export interface CustomerJourneyMetrics {
  stageCounts: Record<JourneyStage, number>;
  conversionRates: {
    leadToProposalPercent: number;
    proposalToReservationPercent: number;
    reservationToCheckInPercent: number;
    checkOutToReturnPercent: number;
  };
  churnRatePercent: number;
  recoveryRatePercent: number;
}

export interface MarketGeographicInsight {
  country: string;
  state?: string;
  city?: string;
  language: string;
  guestsCount: number;
  totalRevenue: number;
  sharePercentage: number;
}

export interface ChannelPerformance {
  channel: string;
  leadsCount: number;
  reservationsCount: number;
  totalRevenue: number;
  conversionRatePercent: number;
  avgTicket: number;
}

export interface MarketingRetentionAnalysis {
  retentionRatePercent: number;
  repeatGuestRatioPercent: number;
  avgDaysBetweenStays: number;
  averageEstimatedLtv: number;
  predominantProfile: string;
  preferredCategories: { categoryName: string; count: number }[];
  preferredAccommodationTypes: { accommodationType: string; count: number }[];
}

export interface MarketingAlert {
  alertId: string;
  type: 'inactive_vip' | 'absent_recurring' | 'unreturned_guest' | 'market_growth' | 'market_decline' | 'high_conversion_channel' | 'low_conversion_channel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impactScore: number; // 0 a 100
  recommendedAction: string;
}

export interface MarketingDashboard {
  segments: MarketingSegmentSummary[];
  journey: CustomerJourneyMetrics;
  retention: MarketingRetentionAnalysis;
  topMarkets: MarketGeographicInsight[];
  channels: ChannelPerformance[];
  alerts: MarketingAlert[];
  generatedAt: string;
}

export interface MarketingSummaryForAI {
  topSegments: { segment: string; count: number; percentage: number }[];
  topMarkets: { country: string; city?: string; guestsCount: number }[];
  retentionRatePercent: number;
  repeatGuestRatioPercent: number;
  avgDaysBetweenStays: number;
  averageLtv: number;
  topPerformingChannel: string;
  marketingAlerts: string[];
}
