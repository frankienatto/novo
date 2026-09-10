import { httpClient } from './httpClient';
import {
  ExecutiveDashboard,
  ExecutiveKpis,
  ExecutiveAlert,
  ExecutivePriorities,
  ExecutiveSummaryModule,
  ExecutiveCopilotDashboard,
  HealthScoreBreakdown,
  ExecutiveRisk,
  ExecutiveOpportunity,
  ExecutiveDailyBrief,
} from '../../types/executiveTypes';

interface ApiResponseWrapper<T> {
  status: string;
  data: T;
  count?: number;
}

export const executiveApi = {
  // Executive Dashboard Endpoints
  getDashboard: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveDashboard>>(
      '/api/executive/dashboard'
    );
  },

  getKpis: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveKpis>>(
      '/api/executive/kpis'
    );
  },

  getAlerts: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveAlert[]>>(
      '/api/executive/alerts'
    );
  },

  getPriorities: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutivePriorities>>(
      '/api/executive/priorities'
    );
  },

  getSummary: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveSummaryModule>>(
      '/api/executive/summary'
    );
  },

  // Executive Copilot Endpoints
  getCopilotDashboard: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveCopilotDashboard>>(
      '/api/executive-copilot/dashboard'
    );
  },

  getCopilotSummary: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<any>>(
      '/api/executive-copilot/summary'
    );
  },

  getCopilotHealth: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<HealthScoreBreakdown>>(
      '/api/executive-copilot/health'
    );
  },

  getCopilotRisks: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveRisk[]>>(
      '/api/executive-copilot/risks'
    );
  },

  getCopilotOpportunities: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveOpportunity[]>>(
      '/api/executive-copilot/opportunities'
    );
  },

  getCopilotBrief: async (_orgId?: string, _propId?: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveDailyBrief>>(
      '/api/executive-copilot/brief'
    );
  },

  askCopilot: async (prompt: string, orgId: string, propId: string, sessionId?: string) => {
    return httpClient.post<{
      success: boolean;
      text?: string;
      response?: string;
      reasoning?: string;
      suggestedActions?: unknown[];
    }>('/api/ai/copilot', {
      prompt,
      organizationId: orgId,
      propertyId: propId,
      sessionId,
      agentId: 'executive_copilot',
    });
  },
};
