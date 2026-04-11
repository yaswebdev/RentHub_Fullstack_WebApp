import React from 'react';
import { cn } from '../lib/utils';

/**
 * Champ de saisie réutilisable.
 * Props : label, error, icon, ...props (tous les attributs HTML input)
 */
export const Input = React.forwardRef(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-bold text-slate-700 tracking-tight">{label}</label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-primary-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:bg-white dark:focus-visible:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-65',
            icon && 'pl-11',
            error && 'border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
