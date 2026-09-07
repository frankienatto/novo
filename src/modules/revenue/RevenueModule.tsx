import React from 'react';
import { Card, Badge, SynapseContextBar } from '../../shared/ui';
import { TrendingUp, DollarSign, Percent, BarChart2 } from 'lucide-react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';

export const RevenueModule: React.FC = () => {
  const { activeProperty } = useSynapsePlatform();

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Revenue Intelligence & Yield Management
            </h1>
            <Badge variant="info" size="sm">{activeProperty?.name || 'Hotel Ativo'}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de tarifas dinâmicas, curvas de demanda, RevPAR e yield optimization integrados à governança Synapse.
          </p>
        </div>
      </div>

      {/* Synapse Context Bar Integrada ao Módulo Revenue */}
      <SynapseContextBar module="revenue" defaultExpanded={true} />

      {/* KPI Cards de Demonstração Operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">RevPAR Estimado</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ 384,50</span>
            <span className="text-xs font-semibold text-emerald-600">+8.4%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">ADR / Diária Média</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">R$ 512,00</span>
            <span className="text-xs font-semibold text-emerald-600">+5.1%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Ocupação Projetada</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">75.1%</span>
            <span className="text-xs font-semibold text-slate-500">30 dias</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Direct Share</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">42.8%</span>
            <span className="text-xs font-semibold text-emerald-600">+3.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
