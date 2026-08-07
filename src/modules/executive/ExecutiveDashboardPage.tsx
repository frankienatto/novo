import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import { useExecutiveKernel } from '../../core/hooks/useExecutiveKernel';
import { ExecutiveOverview } from './ExecutiveOverview';
import { ExecutiveInsightsDrawer } from './ExecutiveInsightsDrawer';
import { Loading, Badge, Button } from '../../shared/ui';
import {
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
  Bot,
  SlidersHorizontal,
} from 'lucide-react';

export const ExecutiveDashboardPage: React.FC = () => {
  const { activeProperty, openCopilot, setActiveModule } =
    useSynapsePlatform();

  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const {
    dashboard,
    copilotDashboard: copilotDash,
    isLoading,
    isError,
    refetchAll: handleRefresh,
  } = useExecutiveKernel();

  const handleAlertAction = () => {
    setActiveModule('decision');
  };

  const handleMitigateRisk = () => {
    setActiveModule('decision');
  };

  const handleExecuteOpportunity = () => {
    setActiveModule('decision');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loading size="lg" text="Carregando Inteligência Executiva Synapse..." />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Erro ao Carregar Dashboard Executivo
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Não foi possível obter a consolidação de KPIs executivos do backend. Verifique a conexão do servidor.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleRefresh} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Executive Intelligence Dashboard
            </h1>
            <Badge variant="info" className="text-xs font-bold">
              <Building2 className="w-3 h-3 mr-1 inline" />
              {activeProperty.name}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Visão consolidada da saúde financeira, comercial, operacional e governança estratégica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Atualizar Dados"
          >
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInsightsOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />}
          >
            Insights & Tendências
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={openCopilot}
            leftIcon={<Bot className="w-3.5 h-3.5" />}
          >
            Executive Copilot
          </Button>
        </div>
      </div>

      {/* Visão Consolidada */}
      <ExecutiveOverview
        dashboard={dashboard}
        copilotDashboard={copilotDash}
        onOpenInsights={() => setIsInsightsOpen(true)}
        onAlertAction={handleAlertAction}
        onMitigateRisk={handleMitigateRisk}
        onExecuteOpportunity={handleExecuteOpportunity}
      />

      {/* Drawer de Insights e Explicabilidade */}
      <ExecutiveInsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        copilotDash={copilotDash}
      />
    </div>
  );
};
