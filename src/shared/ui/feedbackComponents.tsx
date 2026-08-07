import React from 'react';
import { X, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-fade-in`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          {title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300">{children}</div>
        {footer && <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
}) => {
  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className={`w-full ${widthClasses[width]} bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Nenhum dado disponível' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Loading: React.FC<{ label?: string }> = ({ label = 'Carregando dados...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} />;
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Ocorreu um erro ao carregar os dados.', onRetry }) => {
  return (
    <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
        <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      )}
    </div>
  );
};

export const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 px-2 py-1 text-[11px] font-medium text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none">
        {text}
      </div>
    </div>
  );
};
