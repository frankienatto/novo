import React, { useState } from 'react';
import { useSynapsePlatform } from '../../contexts/SynapsePlatformContext';
import { useExecutiveConversation, useExecutiveSuggestions } from '../../core/hooks/useExecutiveHooks';
import { CopilotContextBar } from './CopilotContextBar';
import { SuggestedQuestions } from './SuggestedQuestions';
import { CopilotConversation } from './CopilotConversation';
import { CopilotInput } from './CopilotInput';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';

export const ExecutiveCopilotChat: React.FC = () => {
  const { activeOrg, activeProperty } = useSynapsePlatform();
  const suggestions = useExecutiveSuggestions();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    messages,
    sendMessage,
    status,
    isLoading,
    sessions,
  } = useExecutiveConversation(activeOrg.id, activeProperty.id);

  return (
    <div className="flex flex-col h-full justify-between space-y-3">
      {/* Context Bar */}
      <CopilotContextBar
        propertyName={activeProperty.name}
        orgName={activeOrg.name}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Suggested Questions */}
      <SuggestedQuestions
        questions={suggestions}
        onSelectQuestion={(q) => sendMessage(q)}
      />

      {/* Conversation Area */}
      <CopilotConversation
        messages={messages}
        status={status}
      />

      {/* Input Box */}
      <CopilotInput
        onSendMessage={(text) => sendMessage(text)}
        status={status}
        isLoading={isLoading}
      />

      {/* Session History Drawer */}
      <ConversationHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
      />
    </div>
  );
};
