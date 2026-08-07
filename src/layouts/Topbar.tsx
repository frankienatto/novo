import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSynapsePlatform } from '../contexts/SynapsePlatformContext';
import { useTheme } from '../contexts/ThemeProvider';
import { Badge } from '../shared/ui';

export const Topbar: React.FC = () => {
  const { 
    activeOrg, 
    activeProperty, 
    organizations, 
    properties, 
    setOrganization, 
    setProperty, 
    toggleCopilot,
    activeModule,
    user,
    pendingApprovalsCount
  } = useSynapsePlatform();

  const { theme, setTheme } = useTheme();

  const moduleNames: Record<string, string> = {
    executive: 'Executive Dashboard',
    revenue: 'Revenue Intelligence',
    sales: 'Sales CRM',
    marketing: 'Marketing Intelligence',
    decision: 'Decision Engine',
    approval: 'Human Approval Center',
    planning: 'Planning Center',
    execution: 'Execution Tracking',
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
      {/* Breadcrumbs & Organization Selector */}
      <div className="flex items-center gap-3 text-xs">
        {/* Organization & Property Dropdowns */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={activeProperty.id}
            onChange={(e) => setProperty(e.target.value)}
            className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-900 dark:text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

        <div className="font-semibold text-slate-800 dark:text-slate-200">
          {moduleNames[activeModule] || 'Dashboard'}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Executive Copilot Global Trigger Button */}
        <button
          onClick={toggleCopilot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs hover:shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Executive Copilot</span>
        </button>

        {/* Theme Selector Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTheme('light')}
            className={`p-1 rounded ${theme === 'light' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            title="Tema Claro"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-900 text-emerald-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            title="Tema Escuro"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1 rounded ${theme === 'system' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            title="Tema do Sistema"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
