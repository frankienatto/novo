import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import {
  usePlanningDashboard,
  useGeneratePlaybook,
} from '../../core/hooks/useGovernanceHooks';
import { PlaybookItem } from '../../types/synapseTypes';
import { PlaybookCard } from './PlaybookCard';
import { PlaybookDetailsDrawer } from './PlaybookDetailsDrawer';
import { Card, Button, Badge, Input, EmptyState, ErrorState } from '../../shared/ui';
import {
  Compass,
  Search,
  Lock,
  Plus,
  Layers,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const PlanningCenterPage: React.FC = () => {
  const { activeOrg, activeProperty, user, setActiveModule } =
    useSynapsePlatform();

  const {
    data: playbooks = [],
    isLoading,
    isError,
    refetch,
  } = usePlanningDashboard(activeOrg.id, activeProperty.id);

  const generatePlaybookMutation = useGeneratePlaybook();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredPlaybooks = playbooks.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDetails = (p: PlaybookItem) => {
    setSelectedPlaybook(p);
    setIsDrawerOpen(true);
  };

  const handleStartExecution = (p: PlaybookItem) => {
    // Navega para o módulo de execução
    setActiveModule('execution');
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          <div className="h-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState
          title="Erro ao carregar o Planning Center"
          description="Falha ao obter os playbooks táticos de planejamento."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Planning Center
            </h1>
            <Badge variant="info" className="ml-2">
              Planejamento Tático Operacional
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Geração e estruturação de playbooks operacionais manuais para decisões autorizadas.
          </p>
        </div>

        {/* Safeguard Badge */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
          <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="font-semibold">ADR-005 Execution Protocol</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Total Playbooks
          </span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {playbooks.length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            Prontos p/ Execução
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {playbooks.filter((p) => p.status === 'ready' || p.status === 'draft').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
            Em Execução Board
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {playbooks.filter((p) => p.status === 'in_execution').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
            Concluídos
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {playbooks.filter((p) => p.status === 'completed').length}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 w-full">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do playbook, responsável ou tarefas..."
            icon={<Search className="w-4 h-4 text-zinc-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs font-medium bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ready">Prontos</option>
            <option value="in_execution">Em Execução</option>
            <option value="completed">Concluídos</option>
          </select>
        </div>
      </div>

      {/* Playbooks Grid */}
      {filteredPlaybooks.length === 0 ? (
        <EmptyState
          title="Nenhum playbook encontrado"
          description="Nenhum playbook tático cadastrado com estes critérios."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPlaybooks.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              onViewDetails={handleOpenDetails}
              onStartExecution={handleStartExecution}
            />
          ))}
        </div>
      )}

      {/* Details Drawer */}
      <PlaybookDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        playbook={selectedPlaybook}
        onStartExecution={handleStartExecution}
      />
    </div>
  );
};
