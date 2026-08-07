import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import {
  useDecisionDashboard,
  useDecisionSimulation,
  useApproveRecommendation,
} from '../../core/hooks/useGovernanceHooks';
import { DecisionRecommendation } from '../../types/synapseTypes';
import { DecisionFilters } from './DecisionFilters';
import { DecisionRecommendationCard } from './DecisionRecommendationCard';
import { DecisionDetailsDrawer } from './DecisionDetailsDrawer';
import { SimulationModal } from './SimulationModal';
import { Card, Button, Badge, Loading, EmptyState, ErrorState } from '../../shared/ui';
import {
  BrainCircuit,
  Lock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const DecisionCenterPage: React.FC = () => {
  const { activeOrg, activeProperty, user } = useSynapsePlatform();

  // Query React Query
  const {
    data: recommendations = [],
    isLoading,
    isError,
    refetch,
  } = useDecisionDashboard(activeOrg.id, activeProperty.id);

  // Mutações
  const simulationMutation = useDecisionSimulation();
  const approveMutation = useApproveRecommendation();

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSourceModule, setSelectedSourceModule] = useState('ALL');
  const [selectedImpact, setSelectedImpact] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Modal / Drawer state
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<DecisionRecommendation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [simulatingRecommendation, setSimulatingRecommendation] =
    useState<DecisionRecommendation | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // Filtros aplicados
  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.reasoning.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule =
      selectedSourceModule === 'ALL' || rec.sourceModule === selectedSourceModule;

    const matchesImpact = selectedImpact === 'ALL' || rec.impact === selectedImpact;
    const matchesRisk = selectedRisk === 'ALL' || rec.risk === selectedRisk;
    const matchesPriority =
      selectedPriority === 'ALL' || rec.priority === selectedPriority;

    return (
      matchesSearch && matchesModule && matchesImpact && matchesRisk && matchesPriority
    );
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSourceModule('ALL');
    setSelectedImpact('ALL');
    setSelectedRisk('ALL');
    setSelectedPriority('ALL');
  };

  const handleOpenDrawer = (rec: DecisionRecommendation) => {
    setSelectedRecommendation(rec);
    setIsDrawerOpen(true);
  };

  const handleOpenSimulation = (rec: DecisionRecommendation) => {
    setSimulatingRecommendation(rec);
    setIsSimulationOpen(true);
    simulationMutation.mutate({ recommendationId: rec.id });
  };

  const handleRequestApproval = (rec: DecisionRecommendation) => {
    approveMutation.mutate({
      recommendationId: rec.id,
      approvedBy: user.name,
      notes: 'Submetido para aprovação executiva através do Decision Center',
    });
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
          title="Erro ao carregar o Decision Center"
          description="Não foi possível obter a lista de recomendações do motor analítico."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Decision Center
            </h1>
            <Badge variant="success" className="ml-2">
              Governança Ativa
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Motor de inteligência decisória com explicabilidade, simulação preditiva e salvaguardas ADR-005.
          </p>
        </div>

        {/* ADR-005 Safeguard Notice Header */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 shrink-0">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold block">Salvaguarda ADR-005 READ-ONLY</span>
            <span className="opacity-80">Ações só são executadas mediante aprovação humana explicita.</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Recomendações
          </span>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {recommendations.length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            Aguardando Aprovação
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {recommendations.filter((r) => r.status === 'pending').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
            Aprovadas
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {recommendations.filter((r) => r.status === 'approved' || r.status === 'in_execution').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
            Média de Confiança IA
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {recommendations.length > 0
              ? Math.round(
                  recommendations.reduce((acc, r) => acc + r.confidence, 0) /
                    recommendations.length
                )
              : 0}
            %
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <DecisionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSourceModule={selectedSourceModule}
        onSourceModuleChange={setSelectedSourceModule}
        selectedImpact={selectedImpact}
        onImpactChange={setSelectedImpact}
        selectedRisk={selectedRisk}
        onRiskChange={setSelectedRisk}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        onReset={handleResetFilters}
      />

      {/* Recommendations Cards Grid */}
      {filteredRecommendations.length === 0 ? (
        <EmptyState
          title="Nenhuma recomendação encontrada"
          description="Nenhum item atende aos filtros selecionados. Tente ajustar os parâmetros."
          actionText="Limpar Filtros"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecommendations.map((recommendation) => (
            <DecisionRecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onSelect={handleOpenDrawer}
              onSimulate={handleOpenSimulation}
              onRequestApproval={handleRequestApproval}
            />
          ))}
        </div>
      )}

      {/* Drawers and Modals */}
      <DecisionDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recommendation={selectedRecommendation}
        onSimulate={handleOpenSimulation}
        onRequestApproval={handleRequestApproval}
      />

      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        recommendation={simulatingRecommendation}
        simulationResult={simulationMutation.data}
        isLoading={simulationMutation.isPending}
        onRunSimulation={() =>
          simulatingRecommendation &&
          simulationMutation.mutate({ recommendationId: simulatingRecommendation.id })
        }
      />
    </div>
  );
};
