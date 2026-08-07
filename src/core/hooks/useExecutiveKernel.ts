import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../api/executiveApi';
import { QUERY_KEYS } from '../api/queryKeys';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';

const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos de cache em memória
  gcTime: 10 * 60 * 1000,    // 10 minutos de retenção no Garbage Collection
  refetchOnWindowFocus: false,
  retry: 1,
};

export function useExecutiveKernel() {
  const { activeOrg, activeProperty } = useSynapsePlatform();
  const orgId = activeOrg?.id || 'org_dev_default';
  const propId = activeProperty?.id || 'prop_dev_default';

  const isEnabled = Boolean(orgId && propId);

  // 1. Dashboard Executivo Consolidado
  const dashboardQuery = useQuery({
    queryKey: QUERY_KEYS.executive.dashboard(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getDashboard(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 2. Dashboard Copilot Executivo
  const copilotDashboardQuery = useQuery({
    queryKey: QUERY_KEYS.executive.copilot(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getCopilotDashboard(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 3. Health Score Breakdown
  const healthQuery = useQuery({
    queryKey: QUERY_KEYS.executive.health(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getCopilotHealth(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 4. Executive KPIs
  const kpisQuery = useQuery({
    queryKey: QUERY_KEYS.executive.kpis(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getKpis(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 5. Executive Alerts
  const alertsQuery = useQuery({
    queryKey: QUERY_KEYS.executive.alerts(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getAlerts(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 6. Executive Priorities
  const prioritiesQuery = useQuery({
    queryKey: QUERY_KEYS.executive.priorities(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getPriorities(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 7. Executive Summary
  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.executive.summary(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getSummary(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  // 8. Executive Daily Brief
  const briefQuery = useQuery({
    queryKey: QUERY_KEYS.executive.brief(orgId, propId),
    queryFn: async () => {
      const res = await executiveApi.getCopilotBrief(orgId, propId);
      return res.data;
    },
    ...DEFAULT_QUERY_CONFIG,
    enabled: isEnabled,
  });

  const refetchAll = () => {
    dashboardQuery.refetch();
    copilotDashboardQuery.refetch();
    healthQuery.refetch();
    kpisQuery.refetch();
    alertsQuery.refetch();
    prioritiesQuery.refetch();
    summaryQuery.refetch();
    briefQuery.refetch();
  };

  return {
    orgId,
    propId,

    // Dados consolidados com fallbacks estruturados
    dashboard: dashboardQuery.data ?? null,
    copilotDashboard: copilotDashboardQuery.data ?? null,
    health: healthQuery.data ?? copilotDashboardQuery.data?.healthScores ?? null,
    kpis: kpisQuery.data ?? dashboardQuery.data?.kpis ?? null,
    alerts: alertsQuery.data ?? dashboardQuery.data?.alerts ?? [],
    priorities: prioritiesQuery.data ?? dashboardQuery.data?.priorities ?? null,
    summary: summaryQuery.data ?? dashboardQuery.data?.summary ?? null,
    dailyBrief: briefQuery.data ?? copilotDashboardQuery.data?.dailyBrief ?? null,

    // Estados Globais de Carregamento e Erro
    isLoading:
      dashboardQuery.isLoading ||
      copilotDashboardQuery.isLoading ||
      healthQuery.isLoading,
    isFetching:
      dashboardQuery.isFetching ||
      copilotDashboardQuery.isFetching ||
      healthQuery.isFetching,
    isError:
      dashboardQuery.isError &&
      copilotDashboardQuery.isError &&
      healthQuery.isError,

    // Acesso individual a cada sub-query
    queries: {
      dashboard: dashboardQuery,
      copilotDashboard: copilotDashboardQuery,
      health: healthQuery,
      kpis: kpisQuery,
      alerts: alertsQuery,
      priorities: prioritiesQuery,
      summary: summaryQuery,
      brief: briefQuery,
    },

    // Ações
    refetchAll,
  };
}
