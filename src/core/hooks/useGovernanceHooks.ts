import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decisionApi, approvalApi, planningApi, executionApi } from '../api/moduleApis';
import { queryKeys } from '../api/queryKeys';
import { DecisionRecommendation, ApprovalItem, PlaybookItem, ExecutionRecord } from '../../types/synapseTypes';

// Hooks de Consulta (Queries)
export function useDecisionDashboard(orgId: string, propId: string) {
  return useQuery({
    queryKey: queryKeys.decision.dashboard(orgId, propId),
    queryFn: async () => {
      const res = await decisionApi.getRecommendations(orgId, propId);
      return (res.data as DecisionRecommendation[]) || [];
    },
    enabled: Boolean(orgId && propId),
  });
}

export function useApprovalDashboard(orgId: string, propId: string) {
  return useQuery({
    queryKey: queryKeys.approval.dashboard(orgId, propId),
    queryFn: async () => {
      const [pendingRes, historyRes] = await Promise.all([
        approvalApi.getPending(orgId, propId),
        approvalApi.getHistory(orgId, propId),
      ]);
      return {
        pending: (pendingRes.data as ApprovalItem[]) || [],
        history: (historyRes.data as ApprovalItem[]) || [],
      };
    },
    enabled: Boolean(orgId && propId),
  });
}

export function usePlanningDashboard(orgId: string, propId: string) {
  return useQuery({
    queryKey: queryKeys.planning.dashboard(orgId, propId),
    queryFn: async () => {
      const res = await planningApi.getPlaybooks(orgId, propId);
      return (res.data as PlaybookItem[]) || [];
    },
    enabled: Boolean(orgId && propId),
  });
}

export function useExecutionDashboard(orgId: string, propId: string) {
  return useQuery({
    queryKey: queryKeys.execution.dashboard(orgId, propId),
    queryFn: async () => {
      const res = await executionApi.getExecutions(orgId, propId);
      return (res.data as ExecutionRecord[]) || [];
    },
    enabled: Boolean(orgId && propId),
  });
}

// Hooks de Mutação e Simulação
export function useDecisionSimulation() {
  return useMutation({
    mutationFn: async ({ recommendationId }: { recommendationId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        recommendationId,
        scenarios: [
          {
            scenarioName: 'Cenário Conservador (-10% Demanda)',
            projectedRevenueGain: 'R$ 8.200 / mês',
            occupancyImpactPercent: 3.2,
            riskScore: 12,
          },
          {
            scenarioName: 'Cenário Base (Inércia Atual)',
            projectedRevenueGain: 'R$ 15.400 / mês',
            occupancyImpactPercent: 6.5,
            riskScore: 22,
          },
          {
            scenarioName: 'Cenário Otimista (+15% Alta Temporada)',
            projectedRevenueGain: 'R$ 22.800 / mês',
            occupancyImpactPercent: 9.8,
            riskScore: 35,
          },
        ],
      };
    },
  });
}

export function useApproveRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recommendationId,
      approvedBy,
      notes,
    }: {
      recommendationId: string;
      approvedBy: string;
      notes?: string;
    }) => {
      return approvalApi.approve(recommendationId, approvedBy, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      queryClient.invalidateQueries({ queryKey: ['decision'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
}

export function useRejectRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recommendationId,
      rejectedBy,
      reason,
    }: {
      recommendationId: string;
      rejectedBy: string;
      reason: string;
    }) => {
      return approvalApi.reject(recommendationId, rejectedBy, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      queryClient.invalidateQueries({ queryKey: ['decision'] });
    },
  });
}

export function useGeneratePlaybook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recommendationId,
      owner,
    }: {
      recommendationId: string;
      owner: string;
    }) => {
      return planningApi.generatePlaybook(recommendationId, owner);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      queryClient.invalidateQueries({ queryKey: ['execution'] });
    },
  });
}

export function useExecutionProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      executionId,
      progressPercent,
      completedChecklist,
      notes,
      isBlocked,
    }: {
      executionId: string;
      progressPercent: number;
      completedChecklist: string[];
      notes?: string;
      isBlocked?: boolean;
    }) => {
      return executionApi.updateProgress(executionId, progressPercent, completedChecklist, notes, isBlocked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution'] });
    },
  });
}
