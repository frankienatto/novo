import React, { useState } from 'react';
import { Dialog, Button, Badge } from '../../shared/ui';
import { ApprovalItem } from '../../types/synapseTypes';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ApprovalReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApprovalItem | null;
  mode: 'approve' | 'reject';
  onSubmit: (reasonOrNotes: string) => void;
  isLoading: boolean;
}

export const ApprovalReasonDialog: React.FC<ApprovalReasonDialogProps> = ({
  isOpen,
  onClose,
  item,
  mode,
  onSubmit,
  isLoading,
}) => {
  const [inputReason, setInputReason] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputReason);
    setInputReason('');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'approve'
          ? 'Autorizar Decisão Executiva (Human Approval)'
          : 'Rejeitar Decisão Executiva'
      }
      description={`Item: ${item.title}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {item.sourceModule}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {item.estimatedBenefit}
            </span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 italic">{item.reasoning}</p>
        </div>

        {mode === 'approve' ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Ao aprovar, esta recomendação avançará para a geração de playbook no{' '}
              <strong>Planning Center</strong>. A execução será realizada manualmente conforme ADR-005.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>
              A rejeição arquivará esta decisão na trilha de auditoria e notificará os agentes do sistema.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {mode === 'approve'
              ? 'Notas do Executivo / Instruções Táticas (Opcional)'
              : 'Motivo da Rejeição (Obrigatório para Auditoria)'}
          </label>
          <textarea
            required={mode === 'reject'}
            value={inputReason}
            onChange={(e) => setInputReason(e.target.value)}
            rows={3}
            placeholder={
              mode === 'approve'
                ? 'Ex: Aprovado conforme alinhamento estratégico com a gerência geral.'
                : 'Ex: Risco de aceitação no segmento de eventos corporativos.'
            }
            className="w-full p-3 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          <Button
            variant={mode === 'approve' ? 'success' : 'danger'}
            type="submit"
            isLoading={isLoading}
            leftIcon={
              mode === 'approve' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )
            }
          >
            {mode === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
