import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  Lightbulb, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { Badge, Button } from './basicComponents';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';

export interface ContextualInsightData {
  insightId: string;
  organizationId: string;
  propertyId: string;
  targetModules: string[];
  source: string;
  type: 'INSIGHT' | 'ALERT' | 'RECOMMENDATION' | 'GOAL_CONTEXT' | 'STRATEGIC_OPPORTUNITY';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  title: string;
  summary: string;
  description?: string;
  goalId?: string;
  planId?: string;
  recommendationId?: string;
  expectedImpact?: {
    metric: string;
    expectedChange: string;
    confidence: number;
  };
  actualImpact?: {
    outcome: string;
    achievementRatePercent: number;
  };
  status: 'ACTIVE' | 'EXPIRED' | 'ACKNOWLEDGED' | 'DISMISSED' | 'PENDING_APPROVAL';
  requiresApproval: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface OperationalContextCardProps {
  insight: ContextualInsightData;
  compact?: boolean;
  onOpenApprovalCenter?: () => void;
  className?: string;
}

export const OperationalContextCard: React.FC<OperationalContextCardProps> = ({
  insight,
  compact = false,
  onOpenApprovalCenter,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { setActiveModule } = useSynapsePlatform();

  const handleNavigateToApproval = () => {
    if (onOpenApprovalCenter) {
      onOpenApprovalCenter();
    } else {
      setActiveModule('approval');
    }
  };

  const getPriorityBadgeVariant = (priority: string): 'danger' | 'warning' | 'info' | 'secondary' => {
    switch (priority) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW':
      default: return 'secondary';
    }
  };

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'RECOMMENDATION':
        return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'GOAL_CONTEXT':
        return <Target className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'STRATEGIC_OPPORTUNITY':
        return <TrendingUp className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'INSIGHT':
      default:
        return <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  const isPendingApproval = insight.status === 'PENDING_APPROVAL' || insight.requiresApproval;
  const confidencePercent = Math.round(insight.confidence * 100);

  return (
    <div
      id={`context-card-${insight.insightId}`}
      className={`rounded-xl border transition-all duration-200 ${
        insight.priority === 'CRITICAL'
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
          : isPendingApproval
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      } ${compact ? 'p-3' : 'p-4'} shadow-xs ${className}`}
    >
      {/* Header Compacto */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={getPriorityBadgeVariant(insight.priority)} size="sm">
                {insight.priority}
              </Badge>
              <Badge variant="neutral" size="sm">
                {confidencePercent}% conf.
              </Badge>
              {isPendingApproval && (
                <Badge variant="warning" size="sm">
                  Requer Aprovação Humana (ADR-005)
                </Badge>
              )}
              {insight.expiresAt && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expira: {new Date(insight.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {insight.title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
              {insight.summary}
            </p>
          </div>
        </div>

        {/* Botão de Toggle de Detalhes */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Detalhes Expansíveis Sob Demanda */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3 animate-fade-in">
          {insight.description && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Contextualização Operacional
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {insight.description}
              </p>
            </div>
          )}

          {/* Impacto Esperado */}
          {insight.expectedImpact && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Impacto Esperado
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {insight.expectedImpact.metric.toUpperCase()}: {insight.expectedImpact.expectedChange}
                </span>
              </div>
              <Badge variant="info" size="sm">
                {Math.round(insight.expectedImpact.confidence * 100)}% certeza
              </Badge>
            </div>
          )}

          {/* Impacto Real Medido (Closed-Loop) */}
          {insight.actualImpact && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                    Resultado Closed-Loop
                  </span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {insight.actualImpact.outcome} ({insight.actualImpact.achievementRatePercent}% meta)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rastreabilidade e Fonte */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>Fonte: <strong className="text-slate-600 dark:text-slate-300">{insight.source}</strong></span>
            {insight.goalId && <span>Missão: <code className="font-mono">{insight.goalId}</code></span>}
          </div>

          {/* Botão de Encaminhamento ao Approval Center (ADR-005) */}
          {isPendingApproval && (
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToApproval}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                Revisar no Approval Center
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
