import React from 'react';
import { PlaybookChecklistItem } from '../../types/synapseTypes';
import { CheckSquare, Square, User, Clock } from 'lucide-react';
import { Badge } from '../../shared/ui';

interface PlaybookChecklistProps {
  checklist: PlaybookChecklistItem[];
  onToggleItem?: (itemId: string) => void;
  readOnly?: boolean;
}

export const PlaybookChecklist: React.FC<PlaybookChecklistProps> = ({
  checklist,
  onToggleItem,
  readOnly = false,
}) => {
  if (!checklist || checklist.length === 0) {
    return (
      <p className="text-xs text-zinc-400 italic">Nenhum item cadastrado no checklist.</p>
    );
  }

  return (
    <div className="space-y-2">
      {checklist.map((item) => (
        <div
          key={item.id}
          onClick={() => !readOnly && onToggleItem && onToggleItem(item.id)}
          className={`p-3 rounded-lg border text-xs transition-all flex items-start gap-3 ${
            item.completed
              ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-500 line-through'
              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
          } ${!readOnly ? 'cursor-pointer hover:border-emerald-500/40' : ''}`}
        >
          <div className="mt-0.5 shrink-0">
            {item.completed ? (
              <CheckSquare className="w-4 h-4 text-emerald-500" />
            ) : (
              <Square className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <span className="font-medium block leading-snug">{item.task}</span>

            {item.requiredRole && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <User className="w-3 h-3 text-zinc-400" />
                <span>Papel Requerido: <strong>{item.requiredRole}</strong></span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
