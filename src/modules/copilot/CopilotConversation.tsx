import React from 'react';
import { CopilotMessage } from '../../types/executiveTypes';
import { Badge } from '../../shared/ui';
import { Bot, User, Sparkles, AlertTriangle, ShieldAlert, TrendingUp, DollarSign } from 'lucide-react';

interface CopilotConversationProps {
  messages: CopilotMessage[];
  status: 'idle' | 'thinking' | 'typing' | 'error' | 'offline';
}

export const CopilotConversation: React.FC<CopilotConversationProps> = ({
  messages,
  status,
}) => {
  const getCardIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'opportunity':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
      case 'kpi':
        return <DollarSign className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-2.5 text-xs ${
            msg.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {msg.sender === 'copilot' && (
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
          )}

          <div
            className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-none'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-tl-none'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] opacity-70 border-b border-black/10 dark:border-white/10 pb-1">
              <span className="font-bold">
                {msg.sender === 'user' ? 'Executivo' : 'Synapse Copilot IA'}
              </span>
              <span>{msg.timestamp}</span>
            </div>

            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

            {/* Rich Cards attached to messages */}
            {msg.cards && msg.cards.length > 0 && (
              <div className="space-y-2 pt-1">
                {msg.cards.map((card, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        {getCardIcon(card.type)}
                        <span>{card.title}</span>
                      </div>
                      {card.badgeText && (
                        <Badge variant={card.badgeVariant || 'default'} className="text-[9px]">
                          {card.badgeText}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                      {card.description}
                    </p>
                    {card.kpiValue && (
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {card.kpiValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {msg.sender === 'user' && (
            <div className="w-7 h-7 rounded-xl bg-zinc-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>
      ))}

      {/* States representation */}
      {status === 'thinking' && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 italic p-2">
          <Bot className="w-4 h-4 text-emerald-500 animate-bounce" />
          <span>O orquestrador está analisando os dados do PMS e CRM...</span>
        </div>
      )}
    </div>
  );
};
