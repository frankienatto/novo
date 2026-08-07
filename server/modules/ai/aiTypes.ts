import { GuestIntelligence } from '../crm/intelligenceTypes.ts';
import { RevenueSummaryForAI } from '../revenue/revenueTypes.ts';
import { DirectBookingSummaryForAI } from '../directBooking/directBookingTypes.ts';
import { SalesSummaryForAI } from '../sales/salesTypes.ts';
import { MarketingSummaryForAI } from '../marketing/marketingTypes.ts';
import { ExecutiveSummaryForAI } from '../executive/executiveTypes.ts';
import { ExecutiveCopilotSummaryForAI } from '../executiveCopilot/executiveCopilotTypes.ts';
import { DecisionSummaryForAI } from '../decision/decisionTypes.ts';
import { StrategySummaryForAI } from '../strategy/strategyTypes.ts';
import { ApprovalSummaryForAI } from '../approval/approvalTypes.ts';
import { PlanningSummaryForAI } from '../planning/planningTypes.ts';
import { ExecutionSummaryForAI } from '../execution/executionTypes.ts';

export const DEFAULT_SESSION_HISTORY_LIMIT = 10;


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface SessionMemory {
  sessionId: string;
  organizationId: string;
  propertyId?: string;
  agentId?: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface SessionMemoryRepository {
  getSession(sessionId: string): Promise<SessionMemory | null>;
  saveSession(session: SessionMemory): Promise<SessionMemory>;
  addMessage(
    sessionId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>, 
    meta?: { organizationId: string; propertyId?: string; agentId?: string }
  ): Promise<ChatMessage>;
  getRecentMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  clearSession(sessionId: string): Promise<void>;
}

export interface OperationalContext {
  organization: {
    organizationId: string;
    name: string;
    plan: string;
  } | null;
  property: {
    propertyId: string;
    name: string;
    type: string;
  } | null;
  user: {
    userId: string;
    name: string;
    role: string;
  } | null;
  pmsData?: {
    categories: any[];
    units: any[];
    reservations: any[];
    summary: {
      totalCategories: number;
      totalUnits: number;
      activeUnits: number;
      occupiedUnits: number;
      dirtyUnits: number;
      cleanUnits: number;
      inspectedUnits: number;
      maintenanceUnits: number;
      outOfServiceUnits: number;
      occupancyRatePercent: number;
      totalActiveReservations: number;
    };
    integration?: Record<string, any>;
    guestCrm?: Record<string, any>;
    housekeeping?: any;
    receptionDashboard?: any;
    maintenanceDashboard?: any;
    revenueSummary?: RevenueSummaryForAI | null;
    directBookingSummary?: DirectBookingSummaryForAI | null;
    salesSummary?: SalesSummaryForAI | null;
    marketingSummary?: MarketingSummaryForAI | null;
    executiveSummary?: ExecutiveSummaryForAI | null;
    executiveCopilotSummary?: ExecutiveCopilotSummaryForAI | null;
    decisionSummary?: DecisionSummaryForAI | null;
    strategySummary?: StrategySummaryForAI | null;
    approvalSummary?: ApprovalSummaryForAI | null;
    planningSummary?: PlanningSummaryForAI | null;
    executionSummary?: ExecutionSummaryForAI | null;
  } | null;
  sessionHistory: ChatMessage[];
  guestIntelligence?: GuestIntelligence | null;
  revenueSummary?: RevenueSummaryForAI | null;
  directBookingSummary?: DirectBookingSummaryForAI | null;
  salesSummary?: SalesSummaryForAI | null;
  marketingSummary?: MarketingSummaryForAI | null;
  executiveSummary?: ExecutiveSummaryForAI | null;
  executiveCopilotSummary?: ExecutiveCopilotSummaryForAI | null;
  decisionSummary?: DecisionSummaryForAI | null;
  strategySummary?: StrategySummaryForAI | null;
  approvalSummary?: ApprovalSummaryForAI | null;
  planningSummary?: PlanningSummaryForAI | null;
  executionSummary?: ExecutionSummaryForAI | null;
  metadata: Record<string, any>;
}

export interface AgentSelectionResult {
  agentId: string;
  reason: string;
  confidence: 'HIGH' | 'MEDIUM' | 'FALLBACK';
  matchedKeywords?: string[];
}
