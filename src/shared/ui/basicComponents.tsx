import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  const variantClasses = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : leftIcon ? (
        <span className="inline-flex shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  footer,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5 transition-all ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-3">{action}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
