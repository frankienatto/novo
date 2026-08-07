import { httpClient } from './httpClient';

export const approvalApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/approval/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
  getPending: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown[] }>(`/api/approval/pending?orgId=${orgId}&propertyId=${propId}`);
  },
  getHistory: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown[] }>(`/api/approval/history?orgId=${orgId}&propertyId=${propId}`);
  },
  approve: async (recommendationId: string, approvedBy: string, notes?: string) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/approval/approve', {
      recommendationId,
      approvedBy,
      notes,
    });
  },
  reject: async (recommendationId: string, rejectedBy: string, reason: string) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/approval/reject', {
      recommendationId,
      rejectedBy,
      reason,
    });
  },
};

export const planningApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/planning/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
  getPlaybooks: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown[] }>(`/api/planning/playbooks?orgId=${orgId}&propertyId=${propId}`);
  },
  generatePlaybook: async (recommendationId: string, owner: string) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/planning/generate', {
      recommendationId,
      owner,
    });
  },
};

export const decisionApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/decision/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
  getRecommendations: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown[] }>(`/api/decision/recommendations?orgId=${orgId}&propertyId=${propId}`);
  },
};

export const revenueApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/revenue/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
  getSummary: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/revenue/summary?orgId=${orgId}&propertyId=${propId}`);
  },
};

export const marketingApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/marketing/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
};

export const salesApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/sales/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
};

export const executionApi = {
  getDashboard: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown }>(`/api/execution/dashboard?orgId=${orgId}&propertyId=${propId}`);
  },
  getExecutions: async (orgId: string, propId: string) => {
    return httpClient.get<{ success: boolean; data: unknown[] }>(`/api/execution/executions?orgId=${orgId}&propertyId=${propId}`);
  },
  startExecution: async (executionId: string, owner: string, notes?: string) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/execution/start', {
      executionId,
      owner,
      notes,
    });
  },
  updateProgress: async (executionId: string, progressPercent: number, completedChecklist: string[], notes?: string, isBlocked?: boolean) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/execution/progress', {
      executionId,
      progressPercent,
      completedChecklist,
      notes,
      isBlocked,
    });
  },
  completeExecution: async (executionId: string, owner: string, notes?: string) => {
    return httpClient.post<{ success: boolean; data: unknown }>('/api/execution/complete', {
      executionId,
      owner,
      notes,
    });
  },
};
