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
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveDashboard>>(
      `/api/executive/dashboard?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getKpis: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveKpis>>(
      `/api/executive/kpis?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getAlerts: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveAlert[]>>(
      `/api/executive/alerts?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getPriorities: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutivePriorities>>(
      `/api/executive/priorities?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getSummary: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveSummaryModule>>(
      `/api/executive/summary?orgId=${orgId}&propertyId=${propId}`
    );
  },

  // Executive Copilot Endpoints
  getCopilotDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveCopilotDashboard>>(
      `/api/executive-copilot/dashboard?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getCopilotSummary: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<any>>(
      `/api/executive-copilot/summary?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getCopilotHealth: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<HealthScoreBreakdown>>(
      `/api/executive-copilot/health?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getCopilotRisks: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveRisk[]>>(
      `/api/executive-copilot/risks?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getCopilotOpportunities: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveOpportunity[]>>(
      `/api/executive-copilot/opportunities?orgId=${orgId}&propertyId=${propId}`
    );
  },

  getCopilotBrief: async (orgId: string, propId: string) => {
    return httpClient.get<ApiResponseWrapper<ExecutiveDailyBrief>>(
      `/api/executive-copilot/brief?orgId=${orgId}&propertyId=${propId}`
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
