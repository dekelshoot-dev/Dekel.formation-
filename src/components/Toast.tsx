import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastCallback: ((message: string, type: ToastType) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    console.log(`[Toast ${type}] ${message}`);
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastCallback = (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-3 right-3 md:top-4 md:right-4 z-50 flex flex-col gap-2 md:gap-3 w-full max-w-[280px] sm:max-w-xs md:max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

function ToastCard({ toast, onClose }: ToastCardProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const config = {
    success: {
      bg: 'bg-slate-950/90 border-emerald-500/30 text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />,
      label: 'Succès',
    },
    error: {
      bg: 'bg-slate-950/90 border-rose-500/30 text-rose-300',
      icon: <XCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-400 shrink-0" />,
      label: 'Erreur',
    },
    warning: {
      bg: 'bg-slate-950/90 border-amber-500/30 text-amber-300',
      icon: <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" />,
      label: 'Avertissement',
    },
    info: {
      bg: 'bg-slate-950/90 border-indigo-500/30 text-indigo-300',
      icon: <Info className="w-4 h-4 md:w-5 md:h-5 text-indigo-400 shrink-0" />,
      label: 'Info',
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className={`pointer-events-auto flex items-start gap-2 md:gap-3 p-2.5 md:p-4 rounded-xl md:rounded-2xl border backdrop-blur-md shadow-2xl ${config.bg} transition-all duration-300`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-extrabold opacity-70 mb-0 md:mb-0.5">{config.label}</p>
        <p className="text-[11px] md:text-xs font-medium leading-normal md:leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-white transition-colors shrink-0 rounded-lg p-0.5 hover:bg-white/5 cursor-pointer"
      >
        <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </button>
    </motion.div>
  );
}
