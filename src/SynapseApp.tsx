import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/queryClient';
import { ThemeProvider } from './contexts/ThemeProvider';
import { SynapsePlatformProvider, useSynapsePlatform } from './contexts/SynapsePlatformContext';
import { AppShell } from './layouts/AppShell';
import { ExecutiveModule } from './modules/executive/ExecutiveModule';
import { RevenueModule } from './modules/revenue/RevenueModule';
import { SalesModule, MarketingModule } from './modules/otherModules';
import { DecisionCenterPage } from './modules/decision/DecisionCenterPage';
import { ApprovalCenterPage } from './modules/approval/ApprovalCenterPage';
import { PlanningCenterPage } from './modules/planning/PlanningCenterPage';
import { ExecutionCenterPage } from './modules/execution/ExecutionCenterPage';

const SynapseContentRouter: React.FC = () => {
  const { activeModule } = useSynapsePlatform();

  switch (activeModule) {
    case 'executive':
      return <ExecutiveModule />;
    case 'revenue':
      return <RevenueModule />;
    case 'sales':
      return <SalesModule />;
    case 'marketing':
      return <MarketingModule />;
    case 'decision':
      return <DecisionCenterPage />;
    case 'approval':
      return <ApprovalCenterPage />;
    case 'planning':
      return <PlanningCenterPage />;
    case 'execution':
      return <ExecutionCenterPage />;
    default:
      return <ExecutiveModule />;
  }
};


export const SynapseApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SynapsePlatformProvider>
          <AppShell>
            <SynapseContentRouter />
          </AppShell>
        </SynapsePlatformProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default SynapseApp;
