import React from 'react';
import { HealthScoreBreakdown } from '../../types/executiveTypes';
import { Card, Badge } from '../../shared/ui';
import { ShieldCheck, TrendingUp, HeartPulse, Sparkles, AlertCircle } from 'lucide-react';

interface ExecutiveHealthScoreCardProps {
  health: HealthScoreBreakdown;
  onViewDetails?: () => void;
}

export const ExecutiveHealthScoreCard = React.memo<ExecutiveHealthScoreCardProps>(({
  health,
  onViewDetails,
}) => {
  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const healthMetrics = [
    { label: 'Revenue Health', score: health.revenueHealth },
    { label: 'Commercial Health', score: health.commercialHealth },
    { label: 'Marketing Health', score: health.marketingHealth },
    { label: 'Sales Health', score: health.salesHealth },
    { label: 'Operations Health', score: health.operationalHealth },
    { label: 'Guest Experience', score: health.guestExperienceHealth },
    { label: 'Housekeeping', score: health.housekeepingHealth },
    { label: 'Maintenance', score: health.maintenanceHealth },
  ];

  return (
    <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              Executive Health Score
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Índice holístico de saúde operacional e financeira em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getScoreVariant(health.overallScore)} className="text-sm px-3 py-1 font-extrabold">
            {health.overallScore} / 100
          </Badge>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Insights
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {healthMetrics.map((item) => (
          <div
            key={item.label}
            className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{item.label}</span>
              {item.score < 60 && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-base font-extrabold ${getScoreColor(item.score)}`}>
                {item.score}%
              </span>
              <div className="w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.score >= 80
                      ? 'bg-emerald-500'
                      : item.score >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

ExecutiveHealthScoreCard.displayName = 'ExecutiveHealthScoreCard';
