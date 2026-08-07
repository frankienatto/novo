import React from 'react';
import { DecisionRecommendation } from '../../types/synapseTypes';
import { Card, Badge, Button, Tooltip } from '../../shared/ui';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface DecisionRecommendationCardProps {
  recommendation: DecisionRecommendation;
  onSelect: (item: DecisionRecommendation) => void;
  onSimulate: (item: DecisionRecommendation) => void;
  onRequestApproval: (item: DecisionRecommendation) => void;
}

export const DecisionRecommendationCard: React.FC<DecisionRecommendationCardProps> = ({
  recommendation,
  onSelect,
  onSimulate,
  onRequestApproval,
}) => {
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="success">Impacto Alto</Badge>;
      case 'medium':
        return <Badge variant="warning">Impacto Médio</Badge>;
      default:
        return <Badge variant="default">Impacto Baixo</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="danger">Risco Alto</Badge>;
      case 'medium':
        return <Badge variant="warning">Risco Médio</Badge>;
      default:
        return <Badge variant="success">Risco Baixo</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'p1':
        return <Badge variant="danger">P1 - Crítica</Badge>;
      case 'p2':
        return <Badge variant="warning">P2 - Alta</Badge>;
      case 'p3':
        return <Badge variant="info">P3 - Média</Badge>;
      default:
        return <Badge variant="default">P4 - Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejeitado</Badge>;
      case 'in_execution':
        return <Badge variant="info">Em Execução Manual</Badge>;
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      default:
        return <Badge variant="warning">Aguardando Decisão Executiva</Badge>;
    }
  };

  return (
    <Card variant="interactive" className="p-5 space-y-4 border-l-4 border-l-emerald-500 relative">
      {/* Top Banner & ADR-005 Governance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-[10px] uppercase font-bold tracking-wider">
            <Layers className="w-3 h-3 mr-1 inline" />
            {recommendation.sourceModule}
          </Badge>
          {getPriorityBadge(recommendation.priority)}
          {getStatusBadge(recommendation.status)}
        </div>

        {/* ADR-005 Safeguard Indicator */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>READ-ONLY • Human Approval Required (ADR-005)</span>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
          {recommendation.title}
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
          {recommendation.description}
        </p>
      </div>

      {/* Metrics Row: Benefit, Effort, Confidence, Impact, Risk */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 text-xs">
        <div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold block mb-0.5">
            Retorno Projetado
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 inline" />
            {recommendation.estimatedBenefit}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold block mb-0.5">
            Esforço Tático
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {recommendation.estimatedEffort}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold block mb-0.5">
            Grau de Confiança
          </span>
          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{recommendation.confidence}%</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold block mb-0.5">
            Impacto & Risco
          </span>
          <div className="flex items-center gap-1">
            {getImpactBadge(recommendation.impact)}
            {getRiskBadge(recommendation.risk)}
          </div>
        </div>
      </div>

      {/* Reasoning Snippet */}
      <div className="text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 text-zinc-700 dark:text-zinc-300">
        <strong className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
          Raciocínio Fundamentado pelo Agente ({recommendation.recommendedByAgent}):
        </strong>
        <p className="italic line-clamp-2">{recommendation.reasoning}</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(recommendation)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Explicabilidade & Evidências
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSimulate(recommendation)}
            leftIcon={<Activity className="w-3.5 h-3.5 text-indigo-500" />}
          >
            Simular Cenários
          </Button>

          {recommendation.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRequestApproval(recommendation)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Submeter p/ Aprovação
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
