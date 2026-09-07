import { useQuery } from '@tanstack/react-query';
import { decisionApi } from '../api/moduleApis';
import { QUERY_KEYS } from '../api/queryKeys';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';

export interface UseDistributedContextOptions {
  module: string;
  organizationId?: string;
  propertyId?: string;
  minPriority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  minConfidence?: number;
  enabled?: boolean;
}

export function useDistributedContext({
  module,
  organizationId,
  propertyId,
  minPriority,
  minConfidence,
  enabled = true,
}: UseDistributedContextOptions) {
  const { activeOrg, activeProperty } = useSynapsePlatform();

  // Multi-tenancy estrito: prioriza props explícitos quando fornecidos ou contexto autenticado oficial
  const resolvedOrgId = organizationId || activeOrg?.id;
  const resolvedPropId = propertyId || activeProperty?.id;

  const isQueryEnabled = Boolean(enabled && resolvedOrgId && resolvedPropId && module);

  const query = useQuery({
    queryKey: QUERY_KEYS.decision.moduleContext(resolvedOrgId || '', resolvedPropId || '', module),
    queryFn: async () => {
      if (!resolvedOrgId || !resolvedPropId) {
        return { summary: null, insights: [] };
      }
      const res = await decisionApi.getModuleContext(
        resolvedOrgId,
        resolvedPropId,
        module,
        minPriority,
        minConfidence
      );
      return res.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos de cache
    gcTime: 10 * 60 * 1000,   // 10 minutos no Garbage Collector
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: isQueryEnabled,
  });

  const summary = query.data?.summary || null;
  const insights = query.data?.insights || [];

  const criticalAlertsCount = summary?.criticalAlertsCount ?? insights.filter((i: any) => i.priority === 'CRITICAL').length;
  const pendingRecommendationsCount = summary?.pendingRecommendationsCount ?? insights.filter((i: any) => i.status === 'PENDING_APPROVAL' || i.requiresApproval).length;
  const activeInsightsCount = summary?.activeInsightsCount ?? insights.length;

  return {
    summary,
    insights,
    activeInsightsCount,
    criticalAlertsCount,
    pendingRecommendationsCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    organizationId: resolvedOrgId,
    propertyId: resolvedPropId,
    module,
  };
}
