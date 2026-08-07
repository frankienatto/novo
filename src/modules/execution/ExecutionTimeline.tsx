import React from 'react';
import { TimelineEvent } from '../../types/synapseTypes';
import { Clock, User, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface ExecutionTimelineProps {
  timeline: TimelineEvent[];
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <p className="text-xs text-zinc-400 italic">Nenhum evento registrado na linha do tempo.</p>
    );
  }

  return (
    <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-4 py-2">
      {timeline.map((item) => (
        <div key={item.id} className="relative pl-6">
          {/* Timeline Dot */}
          <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-emerald-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                <User className="w-3 h-3 text-zinc-400" />
                {item.actor}
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.timestamp}
              </span>
            </div>

            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {item.event}
            </p>

            {item.details && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-md">
                {item.details}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
