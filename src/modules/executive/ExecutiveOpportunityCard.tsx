import React from 'react';
import { ExecutiveOpportunity } from '../../types/executiveTypes';
import { Card, Badge, Button } from '../../shared/ui';
import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ExecutiveOpportunityCardProps {
  opportunity: ExecutiveOpportunity;
  onExecuteClick?: (opportunity: ExecutiveOpportunity) => void;
}

export const ExecutiveOpportunityCard: React.FC<ExecutiveOpportunityCardProps> = ({
  opportunity,
  onExecuteClick,
}) => {
  return (
    <Card className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px] uppercase font-extrabold">
              <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
              Oportunidade
            </Badge>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              {opportunity.category}
            </span>
          </div>
          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
            {opportunity.title}
          </h4>
        </div>

        <Badge variant="info" className="text-[10px] font-bold">
          {opportunity.potentialImpact}
        </Badge>
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {opportunity.description}
      </p>

      {opportunity.actionableSteps.length > 0 && (
        <div className="p-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg text-xs space-y-1 border border-emerald-200/50 dark:border-emerald-800/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
            Passos Recomendados:
          </span>
          <ul className="space-y-0.5">
            {opportunity.actionableSteps.map((step, idx) => (
              <li key={idx} className="text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onExecuteClick && (
        <div className="flex justify-end pt-1">
          <Button
            variant="success"
            size="sm"
            className="text-xs h-7 px-2.5"
            onClick={() => onExecuteClick(opportunity)}
          >
            Aproveitar Oportunidade
          </Button>
        </div>
      )}
    </Card>
  );
};
