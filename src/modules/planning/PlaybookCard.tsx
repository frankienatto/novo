import React from 'react';
import { PlaybookItem } from '../../types/synapseTypes';
import { Card, Badge, Button } from '../../shared/ui';
import {
  ClipboardList,
  Clock,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface PlaybookCardProps {
  playbook: PlaybookItem;
  onViewDetails: (item: PlaybookItem) => void;
  onStartExecution?: (item: PlaybookItem) => void;
}

export const PlaybookCard: React.FC<PlaybookCardProps> = ({
  playbook,
  onViewDetails,
  onStartExecution,
}) => {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'p1':
        return <Badge variant="danger">P1 - Crítica</Badge>;
      case 'p2':
        return <Badge variant="warning">P2 - Alta</Badge>;
      case 'p3':
        return <Badge variant="info">P3 - Média</Badge>;
      default:
        return <Badge variant="default">P4 - Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      case 'in_execution':
        return <Badge variant="info">Em Execução Tática</Badge>;
      case 'ready':
        return <Badge variant="warning">Pronto p/ Execução</Badge>;
      default:
        return <Badge variant="default">Rascunho</Badge>;
    }
  };

  const completedCount = playbook.checklist?.filter((c) => c.completed).length || 0;
  const totalCount = playbook.checklist?.length || 0;

  return (
    <Card variant="interactive" className="p-5 space-y-4 border-l-4 border-l-indigo-500">
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-[10px]">
            <Layers className="w-3 h-3 mr-1 inline" />
            {playbook.sourceModule}
          </Badge>
          {getPriorityBadge(playbook.priority)}
          {getStatusBadge(playbook.status)}
        </div>

        {/* Manual Execution Mode Badge ADR-005 */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Lock className="w-3 h-3 text-indigo-500" />
          <span>Execução Manual (ADR-005)</span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {playbook.title}
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
          {playbook.description}
        </p>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
            Responsável Operacional
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            {playbook.owner}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
            Tempo Estimado
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {playbook.estimatedTime}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">
            Checklist Tático
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedCount} / {totalCount} Tarefas
          </span>
        </div>
      </div>

      {/* Dependencies */}
      {playbook.dependencies && playbook.dependencies.length > 0 && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/40 p-2.5 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>Dependências:</strong> {playbook.dependencies.join(', ')}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(playbook)}
          leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
        >
          Ver Playbook & Checklist
        </Button>

        {playbook.status !== 'in_execution' && playbook.status !== 'completed' && onStartExecution && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStartExecution(playbook)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Encaminhar para Execução Board
          </Button>
        )}
      </div>
    </Card>
  );
};
