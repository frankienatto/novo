import React from 'react';
import { Drawer, Badge } from '../../shared/ui';
import { CopilotSession } from '../../types/executiveTypes';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';

interface ConversationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CopilotSession[];
  onSelectSession?: (session: CopilotSession) => void;
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de Sessões Copilot"
      subtitle="Registro de consultas executivas anteriores para rastreabilidade estratégica."
      width="md"
    >
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => {
              if (onSelectSession) onSelectSession(session);
              onClose();
            }}
            className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                {session.title}
              </h4>
              <Badge variant="info" className="text-[10px]">
                {session.messageCount} mensagens
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.createdAt}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                Carregar <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
};
