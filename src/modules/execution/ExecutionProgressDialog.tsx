import React, { useState, useEffect } from 'react';
import { Dialog, Button, Badge } from '../../shared/ui';
import { ExecutionRecord } from '../../types/synapseTypes';
import { PlaybookChecklist } from '../planning/PlaybookChecklist';
import { CheckCircle2, AlertTriangle, Clock, Activity, User, Shield } from 'lucide-react';

interface ExecutionProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  execution: ExecutionRecord | null;
  onSubmitProgress: (
    progressPercent: number,
    completedChecklist: string[],
    notes?: string,
    isBlocked?: boolean
  ) => void;
  isLoading: boolean;
}

export const ExecutionProgressDialog: React.FC<ExecutionProgressDialogProps> = ({
  isOpen,
  onClose,
  execution,
  onSubmitProgress,
  isLoading,
}) => {
  const [progress, setProgress] = useState(0);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (execution) {
      setProgress(execution.progressPercent || 0);
      setCompletedItems(execution.completedChecklist || []);
      setNotes(execution.notes || '');
      setIsBlocked(execution.status === 'blocked');
    }
  }, [execution]);

  if (!execution) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitProgress(progress, completedItems, notes, isBlocked);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Atualizar Progresso Operacional: ${execution.title}`}
      description={`Responsável: ${execution.owner} | Modo: EXECUÇÃO MANUAL (ADR-005)`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Progress Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
            <span>Percentual de Conclusão Operacional</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
              {progress}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Blocked Flag Toggle */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <span className="font-bold text-xs text-amber-900 dark:text-amber-200 block">
                Sinalizar Impedimento / Bloqueio
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-300">
                Marque se a execução estiver impedida por fatores operacionais.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isBlocked}
            onChange={(e) => setIsBlocked(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Notes Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Anotações de Campo do Operador
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex: Treinamento da recepção finalizado. Ajustes nas configurações de cancelamento no balcão efetuados."
            className="w-full p-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Salvar Progresso Manual
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
