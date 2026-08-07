import React from 'react';
import { ExecutivePriorities } from '../../types/executiveTypes';
import { Card, Badge } from '../../shared/ui';
import { Target, CheckCircle2, AlertOctagon, TrendingUp, Sparkles } from 'lucide-react';

interface ExecutivePrioritiesPanelProps {
  priorities: ExecutivePriorities;
}

export const ExecutivePrioritiesPanel = React.memo<ExecutivePrioritiesPanelProps>(({
  priorities,
}) => {
  return (
    <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              Top Prioridades Executivas do Dia
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Direcionamento estratégico recomendado pelo orquestrador Synapse
            </p>
          </div>
        </div>
        <Badge variant="info" className="font-bold text-xs">
          {priorities.dailyPriorities.length} Focos
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Prioridades Diárias */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Prioridades Diárias
          </h4>
          <div className="space-y-1.5">
            {priorities.dailyPriorities.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Riscos Operacionais */}
        {priorities.operationalRisks.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              Riscos Operacionais Sob Monitoramento
            </h4>
            <div className="space-y-1.5">
              {priorities.operationalRisks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-amber-500/5 dark:bg-amber-500/10 rounded-lg border border-amber-200/50 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 font-medium"
                >
                  • {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Oportunidades Comerciais e Revenue */}
        {(priorities.commercialOpportunities.length > 0 ||
          priorities.revenueOpportunities.length > 0) && (
          <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Oportunidades de Receita & Vendas
            </h4>
            <div className="space-y-1.5">
              {[...priorities.revenueOpportunities, ...priorities.commercialOpportunities].map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 font-medium"
                  >
                    • {item}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

ExecutivePrioritiesPanel.displayName = 'ExecutivePrioritiesPanel';
