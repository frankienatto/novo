import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import {
  useApprovalDashboard,
  useApproveRecommendation,
  useRejectRecommendation,
} from '../../core/hooks/useGovernanceHooks';
import { ApprovalItem } from '../../types/synapseTypes';
import { ApprovalTable } from './ApprovalTable';
import { ApprovalReasonDialog } from './ApprovalReasonDialog';
import { ApprovalHistoryDrawer } from './ApprovalHistoryDrawer';
import { Card, Button, Badge, Loading, EmptyState, ErrorState, Drawer } from '../../shared/ui';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  History,
  Lock,
  Eye,
  Clock,
  Layers,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export const ApprovalCenterPage: React.FC = () => {
  const { activeOrg, activeProperty, user } = useSynapsePlatform();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useApprovalDashboard(activeOrg.id, activeProperty.id);

  const approveMutation = useApproveRecommendation();
  const rejectMutation = useRejectRecommendation();

  const pendingItems = data?.pending || [];
  const historyItems = data?.history || [];

  // Dialog & Drawer state
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ApprovalItem | null>(null);

  const handleApproveClick = (item: ApprovalItem) => {
    setSelectedItem(item);
    setDialogMode('approve');
  };

  const handleRejectClick = (item: ApprovalItem) => {
    setSelectedItem(item);
    setDialogMode('reject');
  };

  const handleConfirmAction = (reasonOrNotes: string) => {
    if (!selectedItem || !dialogMode) return;

    if (dialogMode === 'approve') {
      approveMutation.mutate(
        {
          recommendationId: selectedItem.recommendationId || selectedItem.id,
          approvedBy: user.name,
          notes: reasonOrNotes,
        },
        {
          onSuccess: () => {
            setDialogMode(null);
            setSelectedItem(null);
          },
        }
      );
    } else {
      rejectMutation.mutate(
        {
          recommendationId: selectedItem.recommendationId || selectedItem.id,
          rejectedBy: user.name,
          reason: reasonOrNotes,
        },
        {
          onSuccess: () => {
            setDialogMode(null);
            setSelectedItem(null);
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState
          title="Erro ao carregar o Human Approval Center"
          description="Falha ao obter os itens de aprovação pendentes."
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
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Human Approval Center
            </h1>
            {pendingItems.length > 0 && (
              <Badge variant="warning" className="ml-2 font-bold animate-pulse">
                {pendingItems.length} Pendente{pendingItems.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Painel soberano de aprovação executiva responsável pela autorização explícita de mudanças operacionais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsHistoryOpen(true)}
            leftIcon={<History className="w-4 h-4 text-zinc-500" />}
          >
            Trilha de Auditoria ({historyItems.length})
          </Button>

          {/* ADR-005 Governance Safeguard Badge */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold">ADR-005 Compliant</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            Pendentes de Decisão
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingItems.length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
            Aprovados no Mês
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {historyItems.filter((i) => i.status === 'approved').length}
          </div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
            Rejeitados no Mês
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {historyItems.filter((i) => i.status === 'rejected').length}
          </div>
        </Card>
      </div>

      {/* Main Pending Approvals Table */}
      <Card className="p-5 space-y-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Fila de Decisões Finais da Gestão
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Aprovação libera a geração do playbook no Planning Center
          </span>
        </div>

        <ApprovalTable
          items={pendingItems}
          onApproveClick={handleApproveClick}
          onRejectClick={handleRejectClick}
          onViewDetails={(item) => setDetailItem(item)}
        />
      </Card>

      {/* Approval / Rejection Reason Dialog */}
      <ApprovalReasonDialog
        isOpen={Boolean(dialogMode)}
        onClose={() => setDialogMode(null)}
        item={selectedItem}
        mode={dialogMode || 'approve'}
        onSubmit={handleConfirmAction}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />

      {/* History Audit Drawer */}
      <ApprovalHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
      />

      {/* Item Details Modal */}
      {detailItem && (
        <Drawer
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={`Detalhes de Governança: ${detailItem.title}`}
          description={`Módulo Origem: ${detailItem.sourceModule}`}
        >
          <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
              <strong className="block font-bold text-zinc-900 dark:text-zinc-100">
                Raciocínio Submetido
              </strong>
              <p className="leading-relaxed">{detailItem.reasoning}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Benefício Esperado
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {detailItem.estimatedBenefit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Grau de Confiança
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  {detailItem.confidence}%
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="outline" onClick={() => setDetailItem(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
