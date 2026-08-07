import React, { useState } from 'react';
import { Button } from '../../shared/ui';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface CopilotInputProps {
  onSendMessage: (message: string) => void;
  status: 'idle' | 'thinking' | 'typing' | 'error' | 'offline';
  isLoading: boolean;
}

export const CopilotInput: React.FC<CopilotInputProps> = ({
  onSendMessage,
  status,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSendMessage(prompt.trim());
    setPrompt('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Pergunte sobre RevPAR, ocupação, riscos ou estratégias..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
        />
        <Button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          variant="success"
          size="md"
          className="rounded-xl px-4"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>
          {status === 'thinking' && '⏳ Analisando dados do hotel...'}
          {status === 'typing' && '✍️ Sintetizando resposta executiva...'}
          {status === 'offline' && '🔴 Modo off-line ativado'}
          {status === 'idle' && '✨ Pronto para auxiliar nas decisões executivas'}
        </span>
        <span>{prompt.length}/500</span>
      </div>
    </form>
  );
};
