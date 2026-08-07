import React from 'react';
import { PlaybookItem } from '../../types/synapseTypes';
import { Drawer, Badge, Button } from '../../shared/ui';
import { PlaybookChecklist } from './PlaybookChecklist';
import {
  ClipboardList,
  Clock,
  User,
  AlertCircle,
  Lock,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface PlaybookDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playbook: PlaybookItem | null;
  onStartExecution?: (playbook: PlaybookItem) => void;
}

export const PlaybookDetailsDrawer: React.FC<PlaybookDetailsDrawerProps> = ({
  isOpen,
  onClose,
  playbook,
  onStartExecution,
}) => {
  if (!playbook) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Playbook Tático: ${playbook.title}`}
      description={`Módulo Origem: ${playbook.sourceModule} | Responsável: ${playbook.owner}`}
      size="lg"
    >
      <div className="space-y-6 text-sm text-zinc-700 dark:text-zinc-200">
        {/* ADR-005 Governance Notice */}
        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-indigo-950 dark:text-indigo-200">
            <strong className="font-bold text-sm block">Manual Execution Protocol (ADR-005)</strong>
            <p>
              A execução deste playbook é feita exclusivamente por pessoas da equipe do hotel.
              Nenhum robô ou automação externa alterará configurações sem que o operador marque as etapas concluídas na tela.
            </p>
          </div>
        </div>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">
            <Layers className="w-3 h-3 mr-1 inline" />
            {playbook.sourceModule}
          </Badge>
          <Badge variant="default">Prioridade: {playbook.priority.toUpperCase()}</Badge>
          <Badge variant="success">Execução: MANUAL</Badge>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            Descrição Tática
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-lg">
            {playbook.description}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
              Responsável Líder
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              {playbook.owner}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
              Tempo de Execução
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {playbook.estimatedTime}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
              Status Atual
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {playbook.status}
            </span>
          </div>
        </div>

        {/* Dependencies */}
        {playbook.dependencies && playbook.dependencies.length > 0 && (
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Dependências Previas
            </h3>
            <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-300 space-y-1 pl-1">
              {playbook.dependencies.map((dep, idx) => (
                <li key={idx}>{dep}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-2">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            Passo a Passo do Checklist Tático
          </h3>
          <PlaybookChecklist checklist={playbook.checklist} readOnly={true} />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>

          {onStartExecution && playbook.status !== 'in_execution' && (
            <Button
              variant="primary"
              onClick={() => {
                onStartExecution(playbook);
                onClose();
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Iniciar no Execution Center
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
