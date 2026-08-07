import React from 'react';
import { Badge } from '../../shared/ui';
import { Building2, ShieldCheck, History } from 'lucide-react';

interface CopilotContextBarProps {
  propertyName: string;
  orgName: string;
  onOpenHistory?: () => void;
}

export const CopilotContextBar: React.FC<CopilotContextBarProps> = ({
  propertyName,
  orgName,
  onOpenHistory,
}) => {
  return (
    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-[11px]">
            {propertyName} ({orgName})
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            READ ONLY & Human Approval (ADR-005)
          </span>
        </div>
      </div>

      {onOpenHistory && (
        <button
          onClick={onOpenHistory}
          className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
          title="Histórico de Conversas"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sessões</span>
        </button>
      )}
    </div>
  );
};
