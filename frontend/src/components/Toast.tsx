import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, type ToastVariant } from '../contexts/ToastContext';

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode; iconColor: string }> = {
  success: {
    bg: 'bg-emerald-bg',
    border: 'border-emerald-border',
    icon: <CheckCircle className="w-4 h-4" />,
    iconColor: 'text-emerald',
  },
  error: {
    bg: 'bg-status-error/10',
    border: 'border-status-error/30',
    icon: <XCircle className="w-4 h-4" />,
    iconColor: 'text-status-error',
  },
  warning: {
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: 'text-status-warning',
  },
  info: {
    bg: 'bg-status-info/10',
    border: 'border-status-info/30',
    icon: <Info className="w-4 h-4" />,
    iconColor: 'text-status-info',
  },
};

function ToastItem({ id, message, variant }: { id: string; message: string; variant: ToastVariant }) {
  const { removeToast } = useToast();
  const style = VARIANT_STYLES[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      role="alert"
      className={`flex items-start gap-3 w-80 rounded-xl border ${style.bg} ${style.border} px-4 py-3 shadow-2xl shadow-black/50 pointer-events-auto`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${style.iconColor}`}>
        {style.icon}
      </span>
      <p className="flex-1 text-sm text-text-primary leading-snug">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 mt-0.5 text-text-muted hover:text-text-primary transition-colors duration-150 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
