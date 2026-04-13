import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { slideInRight } from '../../lib/animations';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000, 0 = no auto-dismiss
}

interface ToastContextValue {
  toasts: ToastData[];
  show: (variant: ToastVariant, title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((
    variant: ToastVariant,
    title: string,
    message?: string,
    duration?: number,
  ) => {
    const id = `toast-${++toastIdCounter}`;
    const toast: ToastData = { id, variant, title, message, duration };
    setToasts((prev) => [...prev, toast].slice(-5));
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      show('success', title, message, duration),
    [show],
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      show('error', title, message, duration),
    [show],
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      show('warning', title, message, duration),
    [show],
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      show('info', title, message, duration),
    [show],
  );

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used inside ToastProvider');
  return ctx;
}

// Convenience exports
export function useToast(): ToastContextValue {
  return useToastContext();
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const variantConfig: Record<ToastVariant, {
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  titleColor: string;
  msgColor: string;
}> = {
  success: {
    icon: <CheckCircle className="w-4 h-4" />,
    borderColor: 'border-emerald/30',
    bgColor: 'bg-emerald-bg',
    iconColor: 'text-emerald',
    titleColor: 'text-text-primary',
    msgColor: 'text-text-secondary',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    borderColor: 'border-status-error/30',
    bgColor: 'bg-forge-900',
    iconColor: 'text-status-error',
    titleColor: 'text-text-primary',
    msgColor: 'text-text-secondary',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: 'border-status-warning/30',
    bgColor: 'bg-forge-900',
    iconColor: 'text-status-warning',
    titleColor: 'text-text-primary',
    msgColor: 'text-text-secondary',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    borderColor: 'border-status-info/30',
    bgColor: 'bg-forge-900',
    iconColor: 'text-status-info',
    titleColor: 'text-text-primary',
    msgColor: 'text-text-secondary',
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const config = variantConfig[toast.variant];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      variants={slideInRight}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      layout
      role="alert"
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
        ${config.borderColor} ${config.bgColor}
        min-w-72 max-w-sm w-full pointer-events-auto
      `}
    >
      {/* Icon */}
      <span className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.titleColor}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={`text-xs mt-0.5 ${config.msgColor}`}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors ml-1"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
