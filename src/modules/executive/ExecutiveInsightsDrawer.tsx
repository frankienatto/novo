import React from 'react';
import { Drawer, Badge } from '../../shared/ui';
import { HealthScoreBreakdown, ExecutiveCopilotDashboard } from '../../types/executiveTypes';
import { Sparkles, HeartPulse, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface ExecutiveInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  copilotDash?: ExecutiveCopilotDashboard;
}

export const ExecutiveInsightsDrawer: React.FC<ExecutiveInsightsDrawerProps> = ({
  isOpen,
  onClose,
  copilotDash,
}) => {
  if (!copilotDash) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Análise Profunda & Insights Estratégicos"
      subtitle="Explicabilidade completa dos vetores de saúde, gargalos e tendências preditivas."
      width="lg"
    >
      <div className="space-y-5">
        {/* Overall Score Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/30 dark:to-indigo-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                Health Score Global
              </span>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {copilotDash.healthScores.overallScore} / 100
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <Badge variant="danger" className="text-xs font-bold block">
              Score de Risco: {copilotDash.riskScore}%
            </Badge>
            <Badge variant="success" className="text-xs font-bold block">
              Oportunidade: {copilotDash.opportunityScore}%
            </Badge>
          </div>
        </div>

        {/* Recomendativos Estratégicos */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recomendações Estratégicas Preditivas
          </h4>
          <div className="space-y-2">
            {copilotDash.strategicRecommendations.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-800 dark:text-zinc-200 font-medium"
              >
                • {item}
              </div>
            ))}
          </div>
        </div>

        {/* Gargalos Operacionais */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Gargalos Operacionais Identificados
          </h4>
          <div className="space-y-2">
            {copilotDash.operationalBottlenecks.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-200/50 dark:border-rose-800/50 text-xs text-rose-900 dark:text-rose-200 font-medium"
              >
                ⚠ {item}
              </div>
            ))}
          </div>
        </div>

        {/* Tendências Estratégicas */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Tendências Estratégicas Observadas
          </h4>
          <div className="space-y-2">
            {copilotDash.strategicTrends.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 font-medium"
              >
                📈 {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
