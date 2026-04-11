import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContext = createContext(undefined);

/** Fournisseur de notifications toast */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const supprimer = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md border pointer-events-auto min-w-[260px]',
                t.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
                t.type === 'error'   ? 'bg-red-50/90 border-red-200 text-red-800' :
                                       'bg-white/90 border-slate-200 text-slate-800'
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
              {t.type === 'error'   && <AlertCircle  className="h-5 w-5 text-red-500 shrink-0" />}
              {t.type === 'info'    && <Info          className="h-5 w-5 text-primary-500 shrink-0" />}
              <span className="text-sm font-medium pr-4 flex-1">{t.message}</span>
              <button
                onClick={() => supprimer(t.id)}
                className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

/** Hook pour afficher des notifications */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider');
  return context;
};
