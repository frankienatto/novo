import React from 'react';
import { Drawer, Badge, Table } from '../../shared/ui';
import { TableColumn } from '../../shared/ui/feedbackComponents';
import { ApprovalItem } from '../../types/synapseTypes';
import { CheckCircle2, XCircle, Clock, User, Layers } from 'lucide-react';

interface ApprovalHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: ApprovalItem[];
}

export const ApprovalHistoryDrawer: React.FC<ApprovalHistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
}) => {
  const columns: TableColumn<ApprovalItem>[] = [
    {
      key: 'title',
      header: 'Decisão / Módulo',
      render: (item: ApprovalItem) => (
        <div className="space-y-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block">
            {item.title}
          </span>
          <Badge variant="info" className="text-[10px]">
            <Layers className="w-2.5 h-2.5 mr-1 inline" />
            {item.sourceModule}
          </Badge>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Resultado',
      render: (item: ApprovalItem) =>
        item.status === 'approved' ? (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
            Aprovado
          </Badge>
        ) : (
          <Badge variant="danger" className="text-[10px]">
            <XCircle className="w-3 h-3 mr-1 inline" />
            Rejeitado
          </Badge>
        ),
    },
    {
      key: 'decisionDate',
      header: 'Responsável & Data',
      render: (item: ApprovalItem) => (
        <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-0.5">
          <div className="flex items-center gap-1 font-semibold">
            <User className="w-3 h-3 text-zinc-400" />
            {item.approvedBy || item.rejectedBy || 'Executivo'}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <Clock className="w-3 h-3" />
            {item.decisionDate || 'Hoje'}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Justificativa Registrada',
      render: (item: ApprovalItem) => (
        <span className="text-xs italic text-zinc-600 dark:text-zinc-300 line-clamp-2">
          {item.reason || 'Sem observações adicionais.'}
        </span>
      ),
    },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Trilha de Auditoria & Histórico de Governança"
      subtitle="Registro imutável de todas as aprovações e rejeições efetuadas pelo Comitê Executivo."
      width="xl"
    >
      <div className="space-y-4">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Total de Registros de Auditoria
          </span>
          <Badge variant="default" className="font-bold">
            {historyItems.length} Decisões Registradas
          </Badge>
        </div>

        <Table
          data={historyItems}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhuma decisão aprovada ou rejeitada no histórico."
        />
      </div>
    </Drawer>
  );
};
