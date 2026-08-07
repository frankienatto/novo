import React from 'react';
import { ExecutiveAlert } from '../../types/executiveTypes';
import { Card, Badge, Button } from '../../shared/ui';
import { AlertTriangle, ShieldAlert, ArrowRight, Layers } from 'lucide-react';

interface ExecutiveAlertsPanelProps {
  alerts: ExecutiveAlert[];
  onActionClick?: (alert: ExecutiveAlert) => void;
}

export const ExecutiveAlertsPanel = React.memo<ExecutiveAlertsPanelProps>(({
  alerts,
  onActionClick,
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger" className="text-[10px] uppercase tracking-wider font-extrabold">Crítico</Badge>;
      case 'high':
        return <Badge variant="warning" className="text-[10px] uppercase tracking-wider font-bold">Alto</Badge>;
      case 'medium':
        return <Badge variant="info" className="text-[10px] uppercase tracking-wider">Médio</Badge>;
      default:
        return <Badge variant="default" className="text-[10px] uppercase tracking-wider">Baixo</Badge>;
    }
  };

  return (
    <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              Alertas Executivos Críticos
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Inconsistências operacionais e desvios estratégicos em tempo real
            </p>
          </div>
        </div>
        <Badge variant="danger" className="font-bold text-xs">
          {alerts.length} Alertas
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 italic">
          Nenhum alerta crítico ativo no momento.
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.alertId}
              className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl space-y-2 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      <Layers className="w-2.5 h-2.5 inline mr-0.5" />
                      {alert.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {alert.title}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {alert.description}
              </p>

              <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                  <strong>Ação Recomendada:</strong> {alert.recommendedAction}
                </span>
                {onActionClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-indigo-600 dark:text-indigo-400"
                    onClick={() => onActionClick(alert)}
                  >
                    Atuar <ArrowRight className="w-3 h-3 ml-1 inline" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

ExecutiveAlertsPanel.displayName = 'ExecutiveAlertsPanel';
