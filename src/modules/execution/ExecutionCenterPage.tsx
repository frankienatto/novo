import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import {
  useExecutionDashboard,
  useExecutionProgress,
} from '../../core/hooks/useGovernanceHooks';
import { ExecutionRecord } from '../../types/synapseTypes';
import { ExecutionBoard } from './ExecutionBoard';
import { ExecutionTimeline } from './ExecutionTimeline';
import { ExecutionProgressDialog } from './ExecutionProgressDialog';
import { Card, Button, Badge, Drawer, EmptyState, ErrorState } from '../../shared/ui';
import {
  Activity,
  Lock,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';

export const ExecutionCenterPage: React.FC = () => {
  const { activeOrg, activeProperty, user } = useSynapsePlatform();

  const {
    data: executions = [],
    isLoading,
    isError,
    refetch,
  } = useExecutionDashboard(activeOrg.id, activeProperty.id);

  const progressMutation = useExecutionProgress();

  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(
    null
  );
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const [timelineExecution, setTimelineExecution] = useState<ExecutionRecord | null>(
    null
  );
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const handleOpenProgressModal = (item: ExecutionRecord) => {
    setSelectedExecution(item);
    setIsProgressModalOpen(true);
  };

  const handleOpenTimeline = (item: ExecutionRecord) => {
    setTimelineExecution(item);
    setIsTimelineOpen(true);
  };

  const handleSaveProgress = (
    progressPercent: number,
    completedChecklist: string[],
    notes?: string,
    isBlocked?: boolean
  ) => {
    if (!selectedExecution) return;

    progressMutation.mutate(
      {
        executionId: selectedExecution.id,
        progressPercent,
        completedChecklist,
        notes,
        isBlocked,
      },
      {
        onSuccess: () => {
          setIsProgressModalOpen(false);
          setSelectedExecution(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState
          title="Erro ao carregar o Execution Tracking Center"
          description="Não foi possível recuperar os registros de execução operacional."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Execution Tracking Center
            </h1>
            <Badge variant="success" className="ml-2">
              Acompanhamento Tático Manual
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Acompanhamento em tempo real da execução operacional dos playbooks autorizados.
          </p>
        </div>

        {/* Safeguard Badge */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold block">100% Execução Humana (ADR-005)</span>
            <span className="opacity-80">Sem integrações ativas de automação com PMS ou OTAs.</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Total em Acompanhamento
          </span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {executions.length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
            Em Execução Ativa
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {executions.filter((e) => e.status === 'running').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            Impedimentos / Bloqueios
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {executions.filter((e) => e.status === 'blocked').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
            Concluídos com Éxito
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {executions.filter((e) => e.status === 'completed').length}
          </div>
        </Card>
      </div>

      {/* Execution Board (Kanban) */}
      <ExecutionBoard
        executions={executions}
        onOpenProgressModal={handleOpenProgressModal}
        onViewTimeline={handleOpenTimeline}
      />

      {/* Progress Dialog */}
      <ExecutionProgressDialog
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        execution={selectedExecution}
        onSubmitProgress={handleSaveProgress}
        isLoading={progressMutation.isPending}
      />

      {/* Timeline Drawer */}
      {timelineExecution && (
        <Drawer
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
          title={`Linha do Tempo de Auditoria: ${timelineExecution.title}`}
          description={`Responsável: ${timelineExecution.owner} | Progresso: ${timelineExecution.progressPercent}%`}
        >
          <div className="space-y-4">
            <ExecutionTimeline timeline={timelineExecution.timeline || []} />
          </div>
        </Drawer>
      )}
    </div>
  );
};
