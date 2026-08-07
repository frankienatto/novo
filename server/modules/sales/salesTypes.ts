export type PipelineStage = 
  | 'lead'
  | 'inquiry'
  | 'opportunity'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'cancelled';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type LeadSource = 
  | 'website'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'booking'
  | 'airbnb'
  | 'expedia'
  | 'hostelworld'
  | 'phone'
  | 'referral'
  | 'walkin'
  | 'other';

export type InteractionType = 'call' | 'whatsapp' | 'email' | 'note' | 'followup' | 'meeting';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface CommercialInteraction {
  interactionId: string;
  type: InteractionType;
  summary: string;
  authorName: string;
  createdAt: string;
}

export interface NextFollowUp {
  dueDate: string; // ISO String Date ou YYYY-MM-DD
  time?: string;   // HH:mm
  priority: PriorityLevel;
  ownerName: string;
  actionDescription: string;
  completed: boolean;
}

export interface SalesOpportunity {
  opportunityId: string;
  organizationId: string;
  propertyId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  stage: PipelineStage;
  temperature: LeadTemperature;
  score: number; // 0 a 100
  source: LeadSource;
  estimatedValue: number;
  categoryInterest?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestsCount?: {
    adults: number;
    children: number;
  };
  ownerName: string; // Vendedor / Atendente responsável
  nextFollowUp?: NextFollowUp;
  interactions: CommercialInteraction[];
  proposalId?: string; // Vínculo com a proposta comercial (Milestone 9.2)
  lossReason?: string;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
}

export interface PipelineStageSummary {
  stage: PipelineStage;
  count: number;
  totalValue: number;
}

export interface SalesMetrics {
  totalLeads: number;
  totalOpportunities: number;
  totalProposals: number;
  wonDealsCount: number;
  lostDealsCount: number;
  conversionRatePercent: number;
  avgConversionTimeDays: number;
  totalPipelineValue: number;
  totalWonValue: number;
  totalLostValue: number;
  hotLeadsCount: number;
  overdueFollowUpsCount: number;
  pipelineByStage: Record<PipelineStage, { count: number; totalValue: number }>;
  pipelineByOwner: Record<string, { count: number; wonCount: number; wonValue: number }>;
  pipelineBySource: Record<string, { count: number; wonCount: number; conversionRate: number }>;
}

export interface SalesDashboard {
  summary: SalesMetrics;
  topOpportunities: SalesOpportunity[];
  overdueFollowUps: SalesOpportunity[];
  recentInteractions: { opportunityId: string; leadName: string; interaction: CommercialInteraction }[];
  generatedAt: string;
}

export interface SalesSummaryForAI {
  totalPipelineValue: number;
  openOpportunitiesCount: number;
  hotLeadsCount: number;
  wonDealsCount: number;
  overdueFollowUpsCount: number;
  conversionRatePercent: number;
  topPerformingChannel: string;
  commercialAlerts: string[];
  salesOpportunities: string[];
}

export interface CreateOpportunityDTO {
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  stage?: PipelineStage;
  temperature?: LeadTemperature;
  source?: LeadSource;
  estimatedValue: number;
  categoryInterest?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  ownerName?: string;
  notes?: string;
  nextFollowUp?: {
    dueDate: string;
    time?: string;
    priority?: PriorityLevel;
    actionDescription: string;
  };
}

export interface UpdateOpportunityDTO {
  stage?: PipelineStage;
  temperature?: LeadTemperature;
  estimatedValue?: number;
  ownerName?: string;
  lossReason?: string;
  proposalId?: string;
}

export interface AddInteractionDTO {
  type: InteractionType;
  summary: string;
  authorName: string;
}

export interface ScheduleFollowUpDTO {
  dueDate: string;
  time?: string;
  priority?: PriorityLevel;
  ownerName?: string;
  actionDescription: string;
}
