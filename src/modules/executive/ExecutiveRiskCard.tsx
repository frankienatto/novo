import React from 'react';
import { ExecutiveRisk } from '../../types/executiveTypes';
import { Card, Badge, Button } from '../../shared/ui';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExecutiveRiskCardProps {
  risk: ExecutiveRisk;
  onMitigateClick?: (risk: ExecutiveRisk) => void;
}

export const ExecutiveRiskCard: React.FC<ExecutiveRiskCardProps> = ({
  risk,
  onMitigateClick,
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger" className="text-[10px] uppercase font-extrabold">Crítico</Badge>;
      case 'high':
        return <Badge variant="warning" className="text-[10px] uppercase font-bold">Alto</Badge>;
      case 'medium':
        return <Badge variant="info" className="text-[10px] uppercase font-medium">Médio</Badge>;
      default:
        return <Badge variant="default" className="text-[10px] uppercase font-normal">Baixo</Badge>;
    }
  };

  return (
    <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getSeverityBadge(risk.severity)}
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              {risk.category}
            </span>
          </div>
          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
            {risk.title}
          </h4>
        </div>

        <Badge variant="danger" className="text-[10px] font-bold">
          Impacto: {risk.impactScore}/10
        </Badge>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {risk.description}
      </p>

      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs space-y-1 border border-zinc-200/60 dark:border-zinc-700/60">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
          Estratégia de Mitigação:
        </span>
        <p className="text-zinc-700 dark:text-zinc-300 italic text-[11px]">
          {risk.mitigationStrategy}
        </p>
      </div>

      {onMitigateClick && (
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
            onClick={() => onMitigateClick(risk)}
          >
            Mitigar Risco <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};
