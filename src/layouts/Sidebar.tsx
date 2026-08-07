import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Cpu, 
  CheckSquare, 
  Compass, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useSynapsePlatform } from '../contexts/SynapsePlatformContext';
import { Badge } from '../shared/ui';

export interface NavModuleItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeVariant?: 'warning' | 'info' | 'success';
}

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, pendingApprovalsCount } = useSynapsePlatform();

  const navItems: NavModuleItem[] = [
    { id: 'executive', label: 'Executive Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'revenue', label: 'Revenue Intelligence', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'sales', label: 'Sales CRM', icon: <Users className="w-4 h-4" /> },
    { id: 'marketing', label: 'Marketing Intelligence', icon: <Target className="w-4 h-4" /> },
    { id: 'decision', label: 'Decision Engine', icon: <Cpu className="w-4 h-4" /> },
    { 
      id: 'approval', 
      label: 'Human Approval Center', 
      icon: <CheckSquare className="w-4 h-4" />, 
      badge: pendingApprovalsCount,
      badgeVariant: 'warning'
    },
    { id: 'planning', label: 'Planning Center', icon: <Compass className="w-4 h-4" /> },
    { id: 'execution', label: 'Execution Tracking', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            S
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">SYNAPSE</h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Hospitality OS</p>
          </div>
        </div>
        <span className="p-1 rounded bg-slate-800 text-slate-400 text-[10px] font-mono border border-slate-700">v2.5</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Módulos de Governança
        </div>
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <Badge variant={item.badgeVariant || 'warning'} size="sm">
                  {item.badge}
                </Badge>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Governance Safeguard Footer */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px] mb-1">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>ADR-005 Governance</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Sistemas em MODO READ-ONLY. Aprovação Humana obrigatória para todas as recomendações.
        </p>
      </div>
    </aside>
  );
};
