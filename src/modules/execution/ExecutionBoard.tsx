import React from 'react';
import { ExecutionRecord } from '../../types/synapseTypes';
import { Card, Badge, Button } from '../../shared/ui';
import {
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Play,
  Lock,
  Layers,
  ChevronRight,
  Activity,
} from 'lucide-react';

interface ExecutionBoardProps {
  executions: ExecutionRecord[];
  onOpenProgressModal: (item: ExecutionRecord) => void;
  onViewTimeline: (item: ExecutionRecord) => void;
}

export const ExecutionBoard: React.FC<ExecutionBoardProps> = ({
  executions,
  onOpenProgressModal,
  onViewTimeline,
}) => {
  const columns = [
    {
      id: 'waiting',
      title: 'Aguardando Início',
      color: 'border-t-zinc-400',
      badgeVariant: 'default' as const,
      items: executions.filter((e) => e.status === 'waiting'),
    },
    {
      id: 'running',
      title: 'Em Execução Tática',
      color: 'border-t-indigo-500',
      badgeVariant: 'info' as const,
      items: executions.filter((e) => e.status === 'running'),
    },
    {
      id: 'blocked',
      title: 'Bloqueado / Impedimento',
      color: 'border-t-amber-500',
      badgeVariant: 'warning' as const,
      items: executions.filter((e) => e.status === 'blocked'),
    },
    {
      id: 'completed',
      title: 'Concluído com Sucesso',
      color: 'border-t-emerald-500',
      badgeVariant: 'success' as const,
      items: executions.filter((e) => e.status === 'completed'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className={`bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 border-t-4 ${col.color}`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {col.title}
            </h3>
            <Badge variant={col.badgeVariant}>{col.items.length}</Badge>
          </div>

          <div className="space-y-3">
            {col.items.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-6">
                Nenhuma tarefa nesta coluna.
              </p>
            ) : (
              col.items.map((item) => (
                <Card
                  key={item.id}
                  variant="interactive"
                  className="p-3.5 space-y-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-zinc-400">
                        {item.priority.toUpperCase()}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.progressPercent}%
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>

                  {/* Owner */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.owner}
                    </span>
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                      MANUAL
                    </span>
                  </div>

                  {/* Blocked message */}
                  {item.status === 'blocked' && item.blockReason && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-800 dark:text-amber-300">
                      <strong>Impedimento:</strong> {item.blockReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTimeline(item)}
                      title="Ver Linha do Tempo"
                    >
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenProgressModal(item)}
                      rightIcon={<ChevronRight className="w-3 h-3" />}
                    >
                      Atualizar
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
