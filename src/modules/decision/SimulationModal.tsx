import React from 'react';
import { Dialog, Button, Badge, Loading } from '../../shared/ui';
import { DecisionRecommendation } from '../../types/synapseTypes';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: DecisionRecommendation | null;
  simulationResult: any;
  isLoading: boolean;
  onRunSimulation: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  simulationResult,
  isLoading,
  onRunSimulation,
}) => {
  if (!recommendation) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Simulação Preditiva de Cenários Governança"
      description={`Análise estressada para: "${recommendation.title}"`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 text-sm">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loading size="lg" className="mx-auto text-emerald-500" />
            <p className="text-zinc-500 dark:text-zinc-400 text-xs animate-pulse">
              Executando simulações estocásticas e estressando cenários de mercado...
            </p>
          </div>
        ) : simulationResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Simulação Concluída para {recommendation.sourceModule}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRunSimulation}
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Recalcular
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {simulationResult.scenarios?.map((scenario: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {scenario.scenarioName}
                    </h4>
                    <Badge variant={scenario.riskScore > 30 ? 'warning' : 'success'}>
                      Score de Risco: {scenario.riskScore}/100
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">
                        Ganhos Projetados
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {scenario.projectedRevenueGain}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">
                        Impacto na Ocupação
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        +{scenario.occupancyImpactPercent}% de ocupação
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs text-zinc-600 dark:text-zinc-300">
              <strong className="text-zinc-900 dark:text-zinc-100 block mb-1">
                Conclusão da Governança:
              </strong>
              O modelo aponta uma assimetria altamente favorável no Cenário Base com risco residual controlado em 22/100, recomendando submissão imediata ao Human Approval Center.
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <Activity className="w-10 h-10 text-indigo-500 mx-auto" />
            <p className="text-zinc-600 dark:text-zinc-300 text-xs">
              Clique abaixo para estressar os modelos econométricos e simular as projeções desta recomendação.
            </p>
            <Button
              variant="primary"
              onClick={onRunSimulation}
              leftIcon={<Activity className="w-4 h-4" />}
            >
              Iniciar Simulação de Cenários
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
