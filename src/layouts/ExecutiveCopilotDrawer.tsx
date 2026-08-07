import React from 'react';
import { useSynapsePlatform } from '../contexts/SynapsePlatformContext';
import { Drawer } from '../shared/ui';
import { ExecutiveCopilotChat } from '../modules/copilot/ExecutiveCopilotChat';

export const ExecutiveCopilotDrawer: React.FC = () => {
  const { isCopilotOpen, closeCopilot, activeProperty } = useSynapsePlatform();

  return (
    <Drawer
      isOpen={isCopilotOpen}
      onClose={closeCopilot}
      title="Executive Copilot"
      subtitle={`Assistente Inteligente de Decisão Estratégica (${activeProperty.name})`}
      width="lg"
    >
      <div className="h-[calc(100vh-140px)]">
        <ExecutiveCopilotChat />
      </div>
    </Drawer>
  );
};
