import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Badge, Button } from './basicComponents';
import { OperationalContextCard } from './OperationalContextCard';
import { useDistributedContext } from '../../core/hooks/useDistributedContext';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';

export interface SynapseContextBarProps {
  module: string;
  title?: string;
  organizationId?: string;
  propertyId?: string;
  compact?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const SynapseContextBar: React.FC<SynapseContextBarProps> = ({
  module,
  title,
  organizationId,
  propertyId,
  compact = false,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const { setActiveModule } = useSynapsePlatform();

  const {
    insights,
    summary,
    activeInsightsCount,
    criticalAlertsCount,
    pendingRecommendationsCount,
    isLoading,
    isError,
    refetch,
    organizationId: currentOrgId,
    propertyId: currentPropId,
  } = useDistributedContext({
    module,
    organizationId,
    propertyId,
  });

  const moduleDisplayNames: Record<string, string> = {
    pms: 'PMS / Mapa de Ocupação',
    reservations: 'Gestão de Reservas',
    reception: 'Recepção & Front Desk',
    housekeeping: 'Governança & Housekeeping',
    maintenance: 'Manutenção & Engenharia',
    revenue: 'Revenue Management',
    sales: 'Vendas & CRM',
    direct_booking: 'Motor de Reservas Diretas',
    marketing: 'Marketing Intelligence',
    executive: 'Diretoria Executiva',
  };

  const displayName = title || moduleDisplayNames[module] || module.toUpperCase();

  if (isLoading) {
    return (
      <div className={`p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (isError) {
    return null; // Falha silenciosa para não quebrar telas operacionais
  }

  // Estado calmo / sem insights ativos
  if (activeInsightsCount === 0) {
    return (
      <div 
        id={`synapse-context-bar-${module}`}
        className={`px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong className="font-medium text-slate-700 dark:text-slate-300">Inteligência Synapse ({displayName}):</strong> Operação em conformidade com as diretrizes e metas estratégicas ativas.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">0 alertas</span>
      </div>
    );
  }

  return (
    <div
      id={`synapse-context-bar-${module}`}
      className={`rounded-xl border transition-all duration-200 shadow-xs ${
        criticalAlertsCount > 0
          ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/40'
          : pendingRecommendationsCount > 0
          ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40'
          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
      } ${className}`}
    >
      {/* Barra Principal / Resumo */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Contexto Estratégico: {displayName}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {criticalAlertsCount > 0 && (
              <Badge variant="danger" size="sm">
                {criticalAlertsCount} Alerta{criticalAlertsCount > 1 ? 's' : ''} Crítico{criticalAlertsCount > 1 ? 's' : ''}
              </Badge>
            )}

            {pendingRecommendationsCount > 0 && (
              <Badge variant="warning" size="sm">
                {pendingRecommendationsCount} Decis{pendingRecommendationsCount > 1 ? 'ões' : 'ão'} Pendente{pendingRecommendationsCount > 1 ? 's' : ''} (ADR-005)
              </Badge>
            )}

            <Badge variant="neutral" size="sm">
              {activeInsightsCount} Diretriz{activeInsightsCount > 1 ? 'es' : ''}
            </Badge>
          </div>
        </div>

        {/* Ações / Expandir */}
        <div className="flex items-center gap-2 shrink-0">
          {pendingRecommendationsCount > 0 && (
            <button
              onClick={() => setActiveModule('approval')}
              className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium flex items-center gap-1 hover:underline"
            >
              Approval Center <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            title={isExpanded ? 'Recolher inteligência contextual' : 'Expandir diretrizes'}
            aria-expanded={isExpanded}
          >
            <span className="hidden sm:inline text-[11px] font-medium text-slate-500">
              {isExpanded ? 'Ocultar' : 'Ver Detalhes'}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Painel Expansível de Insights */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5 animate-fade-in">
          {summary?.relatedGoals && summary.relatedGoals.length > 0 && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Missões Ativas Vinculadas: <strong className="text-slate-700 dark:text-slate-300">{summary.relatedGoals.join(', ')}</strong></span>
            </div>
          )}

          <div className="space-y-2">
            {insights.map((insight: any) => (
              <OperationalContextCard
                key={insight.insightId}
                insight={insight}
                compact={compact}
                onOpenApprovalCenter={() => setActiveModule('approval')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
