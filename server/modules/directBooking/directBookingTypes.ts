export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'negotiating' | 'accepted' | 'rejected' | 'expired';

export interface CommercialProposal {
  proposalId: string;
  organizationId: string;
  propertyId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  sourceChannel: string; // 'whatsapp', 'website_chat', 'phone', 'email', 'front_desk', 'instagram'
  categoryName: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfNights: number;
  guestsCount: {
    adults: number;
    children: number;
  };
  originalRateDaily: number;
  offeredRateDaily: number;
  totalAmount: number;
  discountPercent: number;
  status: ProposalStatus;
  validUntil: string; // ISO String Date
  notes?: string;
  proposalUrl: string; // Link da proposta para o cliente
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  convertedReservationId?: string; // ID retornado pelo Aloha PMS após criação via n8n
  attendantName?: string;
}

export interface DirectBookingMetrics {
  totalInquiries: number;
  totalProposals: number;
  openProposalsCount: number;
  convertedProposalsCount: number;
  expiredProposalsCount: number;
  rejectedProposalsCount: number;
  conversionRatePercent: number;
  avgConversionTimeHours: number;
  totalPotentialRevenueOpen: number;
  totalConvertedRevenue: number;
  totalLostRevenue: number;
  avgTicketValue: number;
  conversionByChannel: Record<string, { total: number; converted: number; conversionRate: number }>;
  conversionByAttendant: Record<string, { total: number; converted: number; revenue: number }>;
}

export interface DirectBookingDashboard {
  summary: DirectBookingMetrics;
  recentProposals: CommercialProposal[];
  expiringProposals: CommercialProposal[];
  generatedAt: string;
}

export interface DirectBookingSummaryForAI {
  openProposalsCount: number;
  convertedProposalsCount: number;
  conversionRatePercent: number;
  totalPotentialRevenueOpen: number;
  totalConvertedRevenue: number;
  topLeadSource: string;
  commercialAlerts: string[];
  commercialOpportunities: string[];
}

export interface CreateProposalDTO {
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  sourceChannel?: string;
  categoryName: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  offeredRateDaily: number;
  discountPercent?: number;
  validDays?: number;
  notes?: string;
  attendantName?: string;
}

export interface UpdateProposalDTO {
  status?: ProposalStatus;
  notes?: string;
  offeredRateDaily?: number;
  discountPercent?: number;
  validUntil?: string;
  convertedReservationId?: string;
}
