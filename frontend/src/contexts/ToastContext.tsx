/**
 * ToastContext — global toast notification system.
 * Supports success, error, warning, info variants.
 * Auto-dismisses after 5 seconds. Stackable. Accessible.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number; // ms, defaults to 5000; use Infinity to disable auto-dismiss
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
  // Convenience helpers
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType; bg: string; border: string; iconColor: string; textColor: string }
> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-bg',
    border: 'border-emerald-border',
    iconColor: 'text-emerald',
    textColor: 'text-emerald-light',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    iconColor: 'text-status-warning',
    textColor: 'text-status-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-status-info/10',
    border: 'border-status-info/30',
    iconColor: 'text-status-info',
    textColor: 'text-status-info',
  },
};

// ─── Single Toast Component ───────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { id, message, variant, duration = DEFAULT_DURATION } = toast;
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Auto-dismiss unless duration is Infinity
  useEffect(() => {
    if (duration === Infinity) return;
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`
        relative flex items-start gap-3 w-80 max-w-[90vw] rounded-xl border px-4 py-3
        backdrop-blur-sm shadow-2xl pointer-events-auto
        ${config.bg} ${config.border}
      `}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${config.textColor}`}>{message}</p>
      <button
        onClick={() => onRemove(id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 p-0.5 rounded-md opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-1 focus:ring-white/30"
      >
        <X className="w-3.5 h-3.5 text-text-secondary" />
      </button>
    </motion.div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = DEFAULT_DURATION) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {children}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
