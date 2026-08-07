import React from 'react';
import {
  ExecutiveDashboard,
  ExecutiveCopilotDashboard,
  ExecutiveRisk,
  ExecutiveOpportunity,
  ExecutiveAlert,
} from '../../types/executiveTypes';
import { ExecutiveHealthScoreCard } from './ExecutiveHealthScoreCard';
import { ExecutiveKpiGrid } from './ExecutiveKpiGrid';
import { ExecutiveAlertsPanel } from './ExecutiveAlertsPanel';
import { ExecutivePrioritiesPanel } from './ExecutivePrioritiesPanel';
import { ExecutiveSummaryPanel } from './ExecutiveSummaryPanel';
import { ExecutiveRiskCard } from './ExecutiveRiskCard';
import { ExecutiveOpportunityCard } from './ExecutiveOpportunityCard';
import { ShieldAlert, Sparkles } from 'lucide-react';

interface ExecutiveOverviewProps {
  dashboard: ExecutiveDashboard;
  copilotDashboard?: ExecutiveCopilotDashboard;
  onOpenInsights: () => void;
  onAlertAction?: (alert: ExecutiveAlert) => void;
  onMitigateRisk?: (risk: ExecutiveRisk) => void;
  onExecuteOpportunity?: (opp: ExecutiveOpportunity) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  dashboard,
  copilotDashboard,
  onOpenInsights,
  onAlertAction,
  onMitigateRisk,
  onExecuteOpportunity,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Health Score Global */}
      {copilotDashboard?.healthScores && (
        <ExecutiveHealthScoreCard
          health={copilotDashboard.healthScores}
          onViewDetails={onOpenInsights}
        />
      )}

      {/* 2. Grid de KPIs Financeiros, Comerciais e Operacionais */}
      <ExecutiveKpiGrid kpis={dashboard.kpis} />

      {/* 3. Painéis de Alertas e Prioridades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExecutiveAlertsPanel
          alerts={dashboard.alerts}
          onActionClick={onAlertAction}
        />
        <ExecutivePrioritiesPanel priorities={dashboard.priorities} />
      </div>

      {/* 4. Top Riscos & Top Oportunidades */}
      {copilotDashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Riscos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Top Riscos Estratégicos & Operacionais
              </h3>
            </div>
            <div className="space-y-3">
              {copilotDashboard.topRisks.slice(0, 3).map((risk) => (
                <ExecutiveRiskCard
                  key={risk.riskId}
                  risk={risk}
                  onMitigateClick={onMitigateRisk}
                />
              ))}
            </div>
          </div>

          {/* Top Oportunidades */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Top Oportunidades Estratégicas
              </h3>
            </div>
            <div className="space-y-3">
              {copilotDashboard.topOpportunities.slice(0, 3).map((opp) => (
                <ExecutiveOpportunityCard
                  key={opp.opportunityId}
                  opportunity={opp}
                  onExecuteClick={onExecuteOpportunity}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Resumo e Briefing Executivo */}
      <ExecutiveSummaryPanel
        summary={dashboard.summary}
        brief={copilotDashboard?.dailyBrief}
      />
    </div>
  );
};
