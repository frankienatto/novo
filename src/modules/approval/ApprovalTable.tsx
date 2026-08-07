import React from 'react';
import { ApprovalItem } from '../../types/synapseTypes';
import { Table, Badge, Button } from '../../shared/ui';
import { TableColumn } from '../../shared/ui/feedbackComponents';
import { ShieldCheck, CheckCircle2, XCircle, Eye, Layers } from 'lucide-react';

interface ApprovalTableProps {
  items: ApprovalItem[];
  onApproveClick: (item: ApprovalItem) => void;
  onRejectClick: (item: ApprovalItem) => void;
  onViewDetails: (item: ApprovalItem) => void;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({
  items,
  onApproveClick,
  onRejectClick,
  onViewDetails,
}) => {
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="success">Impacto Alto</Badge>;
      case 'medium':
        return <Badge variant="warning">Impacto Médio</Badge>;
      default:
        return <Badge variant="default">Impacto Baixo</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="danger">Risco Alto</Badge>;
      case 'medium':
        return <Badge variant="warning">Risco Médio</Badge>;
      default:
        return <Badge variant="success">Risco Baixo</Badge>;
    }
  };

  const columns: TableColumn<ApprovalItem>[] = [
    {
      key: 'title',
      header: 'Recomendação & Módulo',
      render: (item: ApprovalItem) => (
        <div className="space-y-1">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
            {item.title}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-[10px]">
              <Layers className="w-2.5 h-2.5 mr-1 inline" />
              {item.sourceModule}
            </Badge>
            <span className="text-[10px] text-zinc-400">ID: {item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'impact',
      header: 'Impacto / Risco',
      render: (item: ApprovalItem) => (
        <div className="flex items-center gap-1.5">
          {getImpactBadge(item.impact)}
          {getRiskBadge(item.risk)}
        </div>
      ),
    },
    {
      key: 'confidence',
      header: 'Confiança IA',
      render: (item: ApprovalItem) => (
        <div className="flex items-center gap-1 font-bold text-xs text-zinc-800 dark:text-zinc-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {item.confidence}%
        </div>
      ),
    },
    {
      key: 'estimatedBenefit',
      header: 'Benefício Esperado',
      render: (item: ApprovalItem) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
          {item.estimatedBenefit}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações de Governança',
      render: (item: ApprovalItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(item)}
            title="Ver Detalhes"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={() => onApproveClick(item)}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Aprovar
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => onRejectClick(item)}
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
          >
            Rejeitar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      data={items}
      columns={columns}
      keyExtractor={(item) => item.id}
      emptyMessage="Nenhuma recomendação pendente de aprovação humana no momento."
    />
  );
};
