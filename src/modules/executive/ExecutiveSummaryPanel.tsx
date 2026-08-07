import React from 'react';
import { ExecutiveSummaryModule, ExecutiveDailyBrief } from '../../types/executiveTypes';
import { Card, Badge } from '../../shared/ui';
import { FileText, Zap, Compass, Building, Sparkles } from 'lucide-react';

interface ExecutiveSummaryPanelProps {
  summary: ExecutiveSummaryModule;
  brief?: ExecutiveDailyBrief;
}

export const ExecutiveSummaryPanel = React.memo<ExecutiveSummaryPanelProps>(({
  summary,
  brief,
}) => {
  return (
    <Card className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              Executive Daily Brief & Resumos de Setor
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Síntese holística gerada pelos agentes analíticos em tempo real
            </p>
          </div>
        </div>
        <Badge variant="info" className="text-xs font-bold">
          <Sparkles className="w-3 h-3 mr-1 inline" />
          Síntese Agregada IA
        </Badge>
      </div>

      {/* Daily Brief Highlight */}
      {brief && (
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-white to-emerald-50/80 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-emerald-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Diretriz Executiva do Dia
            </span>
            <Badge variant="success" className="text-[10px]">
              Foco: {brief.primaryFocusArea}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {brief.summary}
          </p>
          <div className="p-2 bg-white/80 dark:bg-zinc-900/80 rounded-lg text-xs italic text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50">
            <strong>Key Takeaway:</strong> {brief.strategicTakeaway}
          </div>
        </div>
      )}

      {/* Grid de Resumos Setoriais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Operações do Dia
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.operationalToday}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Comercial & Vendas
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.commercialSummary}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Análise Financeira
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.financialAnalyticalSummary}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Recepção & Atendimento
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.receptionSummary}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Governança / Housekeeping
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.housekeepingSummary}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
            Manutenção & Infraestrutura
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {summary.maintenanceSummary}
          </p>
        </div>
      </div>
    </Card>
  );
});

ExecutiveSummaryPanel.displayName = 'ExecutiveSummaryPanel';
