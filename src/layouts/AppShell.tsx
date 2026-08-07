import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ExecutiveCopilotDrawer } from './ExecutiveCopilotDrawer';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Executive Copilot Drawer */}
      <ExecutiveCopilotDrawer />
    </div>
  );
};
