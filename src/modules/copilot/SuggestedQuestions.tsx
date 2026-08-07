import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion,
}) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-500" />
        Perguntas Sugeridas
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="text-[11px] px-2.5 py-1 bg-zinc-100 hover:bg-indigo-50 dark:bg-zinc-800 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-full transition-colors text-left font-medium"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
