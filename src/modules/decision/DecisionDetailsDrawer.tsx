import React from 'react';
import { DecisionRecommendation } from '../../types/synapseTypes';
import { Drawer, Badge, Button } from '../../shared/ui';
import {
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface DecisionDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: DecisionRecommendation | null;
  onSimulate: (item: DecisionRecommendation) => void;
  onRequestApproval: (item: DecisionRecommendation) => void;
}

export const DecisionDetailsDrawer: React.FC<DecisionDetailsDrawerProps> = ({
  isOpen,
  onClose,
  recommendation,
  onSimulate,
  onRequestApproval,
}) => {
  if (!recommendation) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Explicabilidade & Transparência da Recomendação"
      description={`ID da Decisão: ${recommendation.id}`}
      size="lg"
    >
      <div className="space-y-6 text-sm text-zinc-700 dark:text-zinc-200">
        {/* ADR-005 Safeguard Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
            <strong className="font-bold text-sm block">Salvaguarda de Governança (ADR-005)</strong>
            <p>
              Esta decisão foi gerada pelo motor analítico em modo <strong>READ-ONLY</strong>.
              Nenhuma alteração direta em tarifas, inventários, OTAs ou PMS será feita sem a intervenção explícita de aprovação por um executivo humano no <strong>Human Approval Center</strong>.
            </p>
          </div>
        </div>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">
            <Layers className="w-3 h-3 mr-1 inline" />
            {recommendation.sourceModule}
          </Badge>
          <Badge variant={recommendation.impact === 'high' ? 'success' : 'warning'}>
            Impacto: {recommendation.impact.toUpperCase()}
          </Badge>
          <Badge variant={recommendation.risk === 'high' ? 'danger' : 'success'}>
            Risco: {recommendation.risk.toUpperCase()}
          </Badge>
          <Badge variant="default">
            Prioridade: {recommendation.priority.toUpperCase()}
          </Badge>
        </div>

        {/* Title and Full Description */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {recommendation.title}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
              Benefício Estimado
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {recommendation.estimatedBenefit}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
              Esforço de Execução
            </span>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Clock className="w-4 h-4 text-zinc-400" />
              {recommendation.estimatedEffort}
            </span>
          </div>

          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
              Grau de Confiança
            </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {recommendation.confidence}%
            </span>
          </div>
        </div>

        {/* Full AI Reasoning */}
        <div className="space-y-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Raciocínio Analítico do Agente ({recommendation.recommendedByAgent})
          </h3>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-relaxed text-xs space-y-2">
            <p className="whitespace-pre-wrap">{recommendation.reasoning}</p>
          </div>
        </div>

        {/* Data Evidence List */}
        <div className="space-y-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Evidências & Dados de Suporte
          </h3>
          <ul className="space-y-2">
            {recommendation.evidence?.map((item, idx) => (
              <li
                key={idx}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => onSimulate(recommendation)}
            className="w-full sm:w-auto"
            leftIcon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
          >
            Simular Cenários Preditivos
          </Button>

          {recommendation.status === 'pending' && (
            <Button
              variant="primary"
              onClick={() => {
                onRequestApproval(recommendation);
                onClose();
              }}
              className="w-full sm:w-auto"
            >
              Enviar para Aprovação Humana
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
