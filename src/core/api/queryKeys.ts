export const queryKeys = {
  executive: {
    dashboard: (orgId: string, propId: string) => ['executive', 'dashboard', orgId, propId] as const,
    kpis: (orgId: string, propId: string) => ['executive', 'kpis', orgId, propId] as const,
    alerts: (orgId: string, propId: string) => ['executive', 'alerts', orgId, propId] as const,
    priorities: (orgId: string, propId: string) => ['executive', 'priorities', orgId, propId] as const,
    summary: (orgId: string, propId: string) => ['executive', 'summary', orgId, propId] as const,
    copilot: (orgId: string, propId: string) => ['executive', 'copilot', orgId, propId] as const,
    health: (orgId: string, propId: string) => ['executive', 'health', orgId, propId] as const,
    brief: (orgId: string, propId: string) => ['executive', 'brief', orgId, propId] as const,
  },
  revenue: {
    dashboard: (orgId: string, propId: string) => ['revenue', 'dashboard', orgId, propId] as const,
    pricing: (orgId: string, propId: string) => ['revenue', 'pricing', orgId, propId] as const,
  },
  sales: {
    dashboard: (orgId: string, propId: string) => ['sales', 'dashboard', orgId, propId] as const,
    pipeline: (orgId: string, propId: string) => ['sales', 'pipeline', orgId, propId] as const,
  },
  marketing: {
    dashboard: (orgId: string, propId: string) => ['marketing', 'dashboard', orgId, propId] as const,
    campaigns: (orgId: string, propId: string) => ['marketing', 'campaigns', orgId, propId] as const,
  },
  decision: {
    dashboard: (orgId: string, propId: string) => ['decision', 'dashboard', orgId, propId] as const,
    recommendations: (orgId: string, propId: string) => ['decision', 'recommendations', orgId, propId] as const,
  },
  approval: {
    dashboard: (orgId: string, propId: string) => ['approval', 'dashboard', orgId, propId] as const,
    pending: (orgId: string, propId: string) => ['approval', 'pending', orgId, propId] as const,
    history: (orgId: string, propId: string) => ['approval', 'history', orgId, propId] as const,
  },
  planning: {
    dashboard: (orgId: string, propId: string) => ['planning', 'dashboard', orgId, propId] as const,
    playbooks: (orgId: string, propId: string) => ['planning', 'playbooks', orgId, propId] as const,
  },
  execution: {
    dashboard: (orgId: string, propId: string) => ['execution', 'dashboard', orgId, propId] as const,
    executions: (orgId: string, propId: string) => ['execution', 'executions', orgId, propId] as const,
  },
  user: {
    profile: () => ['user', 'profile'] as const,
    notifications: (orgId: string, propId: string) => ['user', 'notifications', orgId, propId] as const,
  }
};

export const QUERY_KEYS = queryKeys;
