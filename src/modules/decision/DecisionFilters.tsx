import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Input } from '../../shared/ui';

interface DecisionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSourceModule: string;
  onSourceModuleChange: (value: string) => void;
  selectedImpact: string;
  onImpactChange: (value: string) => void;
  selectedRisk: string;
  onRiskChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
  onReset: () => void;
}

export const DecisionFilters: React.FC<DecisionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedSourceModule,
  onSourceModuleChange,
  selectedImpact,
  onImpactChange,
  selectedRisk,
  onRiskChange,
  selectedPriority,
  onPriorityChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar recomendações por título, raciocínio ou agente..."
            icon={<Search className="w-4 h-4 text-zinc-400" />}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Selector */}
          <select
            value={selectedSourceModule}
            onChange={(e) => onSourceModuleChange(e.target.value)}
            className="h-10 px-3 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Todos os Módulos</option>
            <option value="Revenue Intelligence">Revenue Intelligence</option>
            <option value="Marketing Intelligence">Marketing Intelligence</option>
            <option value="Sales CRM">Sales CRM</option>
            <option value="Operational Planning">Operational Planning</option>
          </select>

          {/* Impact Selector */}
          <select
            value={selectedImpact}
            onChange={(e) => onImpactChange(e.target.value)}
            className="h-10 px-3 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Impacto: Todos</option>
            <option value="high">Alto Impacto</option>
            <option value="medium">Médio Impacto</option>
            <option value="low">Baixo Impacto</option>
          </select>

          {/* Risk Selector */}
          <select
            value={selectedRisk}
            onChange={(e) => onRiskChange(e.target.value)}
            className="h-10 px-3 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Risco: Todos</option>
            <option value="low">Risco Baixo</option>
            <option value="medium">Risco Médio</option>
            <option value="high">Risco Alto</option>
          </select>

          {/* Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="h-10 px-3 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Prioridade: Todas</option>
            <option value="p1">P1 - Crítica</option>
            <option value="p2">P2 - Alta</option>
            <option value="p3">P3 - Média</option>
            <option value="p4">P4 - Normal</option>
          </select>

          <button
            onClick={onReset}
            className="h-10 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Limpar filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};
