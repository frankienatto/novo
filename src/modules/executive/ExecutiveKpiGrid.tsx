import React from 'react';
import { ExecutiveKpis } from '../../types/executiveTypes';
import { Card, Badge } from '../../shared/ui';
import {
  DollarSign,
  TrendingUp,
  Users,
  Bed,
  Sparkles,
  ClipboardList,
  Wrench,
  ShieldAlert,
  BarChart3,
  Percent,
} from 'lucide-react';

interface ExecutiveKpiGridProps {
  kpis: ExecutiveKpis;
}

export const ExecutiveKpiGrid = React.memo<ExecutiveKpiGridProps>(({ kpis }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* KPIs Financeiros & Revenue */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            KPIs Financeiros & Revenue
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Receita Total</span>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(kpis.revenue.totalRevenue)}
            </div>
            <Badge variant="success" className="text-[10px]">Pace: {kpis.revenue.bookingPacePercent}%</Badge>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">ADR (Diária Média)</span>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(kpis.revenue.adr)}
            </div>
            <span className="text-[10px] text-zinc-400">Tarifa Efetiva</span>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">RevPAR</span>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpis.revenue.revpar)}
            </div>
            <span className="text-[10px] text-zinc-400">Por Quarto Disponível</span>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Taxa de Ocupação</span>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {kpis.revenue.occupancyRatePercent}%
            </div>
            <Badge variant={kpis.revenue.occupancyRatePercent >= 75 ? 'success' : 'warning'} className="text-[10px]">
              {kpis.revenue.pickupCount} Pickups Hoje
            </Badge>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">LTV Médio Hóspede</span>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(kpis.retentionAndMarketing.averageLtv)}
            </div>
            <span className="text-[10px] text-zinc-400">Retenção: {kpis.retentionAndMarketing.retentionRatePercent}%</span>
          </Card>
        </div>
      </div>

      {/* KPIs Comerciais & Marketing */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            KPIs Comerciais & Pipeline
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Pipeline Comercial</span>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(kpis.commercial.pipelineValue)}
            </div>
            <span className="text-[10px] text-zinc-400">{kpis.commercial.openOpportunitiesCount} Oportunidades</span>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Propostas Ativas</span>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              {kpis.commercial.proposalsCount}
            </div>
            <span className="text-[10px] text-zinc-400">Em Negociação</span>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Taxa de Conversão</span>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {kpis.commercial.conversionRatePercent}%
            </div>
            <span className="text-[10px] text-zinc-400">Lead para Reserva</span>
          </Card>

          <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Canal Destaque</span>
            <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
              {kpis.retentionAndMarketing.topPerformingChannel}
            </div>
            <span className="text-[10px] text-zinc-400">Maior ROI</span>
          </Card>
        </div>
      </div>

      {/* KPIs Operacionais */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            KPIs Operacionais (Hoje)
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Check-ins Pendentes</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{kpis.operations.pendingCheckInsCount}</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Check-outs Pendentes</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{kpis.operations.pendingCheckOutsCount}</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Hóspedes In-House</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{kpis.operations.inHouseCount}</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Limpezas Pendentes</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{kpis.operations.pendingCleaningsCount}</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Limpezas Urgentes</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{kpis.operations.urgentCleaningsCount}</span>
          </Card>

          <Card className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">Manutenção Crítica</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{kpis.operations.criticalMaintenanceCount}</span>
          </Card>
        </div>
      </div>
    </div>
  );
});

ExecutiveKpiGrid.displayName = 'ExecutiveKpiGrid';
