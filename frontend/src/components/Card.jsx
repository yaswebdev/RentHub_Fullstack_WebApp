import React from 'react';
import { cn } from '../lib/utils';

/** Carte conteneur principale */
export const Card = ({ className, hover, children, ...props }) => (
  <div
    className={cn(
      'rounded-3xl border border-slate-200/50 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm transition-all duration-300',
      hover && 'hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/** En-tête de carte */
export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6 sm:p-7', className)} {...props}>
    {children}
  </div>
);

/** Titre de carte */
export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-xl font-bold leading-none tracking-tight text-slate-900', className)} {...props}>
    {children}
  </h3>
);

/** Corps de carte */
export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-0 sm:p-7 sm:pt-0', className)} {...props}>
    {children}
  </div>
);

/** Pied de carte */
export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0 sm:p-7 sm:pt-0', className)} {...props}>
    {children}
  </div>
);
