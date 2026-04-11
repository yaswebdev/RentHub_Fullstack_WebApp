import React from 'react';
import { cn } from '../lib/utils';

/**
 * Composant Bouton réutilisable.
 * Props :
 *   variant  - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *   size     - 'sm' | 'md' | 'lg' | 'icon'
 *   isLoading - boolean
 */
export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, type, ...props }, ref) => {
    const variantes = {
      primary:
        'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-[0_8px_16px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_20px_-8px_rgba(99,102,241,0.6)] hover:-translate-y-[1px] active:translate-y-[0px] active:scale-[0.98]',
      secondary:
        'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-[1px] active:translate-y-[0px] active:scale-[0.98]',
      outline:
        'border-2 border-primary-200 dark:border-primary-800 bg-transparent text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 active:scale-[0.98]',
      ghost:
        'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-[0.98] active:bg-slate-200/80 dark:active:bg-slate-700/80',
      danger:
        'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_16px_-6px_rgba(220,38,38,0.5)] hover:-translate-y-[1px] hover:shadow-[0_12px_20px_-8px_rgba(220,38,38,0.6)] active:translate-y-[0px] active:scale-[0.98]',
    };

    const tailles = {
      sm:   'h-9 px-4 text-xs rounded-xl',
      md:   'h-11 px-6 py-2 text-sm rounded-xl',
      lg:   'h-12 px-8 text-base rounded-2xl',
      icon: 'h-11 w-11 p-2 rounded-xl',
    };

    const estDesactive = Boolean(disabled || isLoading);

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={estDesactive}
        aria-busy={isLoading ? 'true' : undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold tracking-wide ui-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none disabled:transform-none',
          variantes[variant],
          tailles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
