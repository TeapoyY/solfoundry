import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast notification variant types.
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Core toast data shape.
 */
export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /**
   * Optional title shown in bold before the message.
   */
  title?: string;
  /**
   * Auto-dismiss delay in ms. Defaults to 5000. Pass 0 to disable auto-dismiss.
   */
  duration?: number;
}

/**
 * Props for the individual ToastItem component.
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * Returns the appropriate icon component for a toast variant.
 */
function variantIcon(variant: ToastVariant) {
  switch (variant) {
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald flex-shrink-0" />;
    case 'error':   return <XCircle className="w-4 h-4 text-status-error flex-shrink-0" />;
    case 'warning':  return <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0" />;
    case 'info':     return <Info className="w-4 h-4 text-status-info flex-shrink-0" />;
  }
}

/**
 * Returns border and background color class strings for a toast variant.
 */
function variantStyles(variant: ToastVariant): { border: string; bg: string } {
  switch (variant) {
    case 'success':
      return { border: 'border-emerald/30', bg: 'bg-emerald-bg/60' };
    case 'error':
      return { border: 'border-status-error/30', bg: 'bg-[rgba(255,82,82,0.08)]' };
    case 'warning':
      return { border: 'border-status-warning/30', bg: 'bg-[rgba(255,179,0,0.08)]' };
    case 'info':
      return { border: 'border-status-info/30', bg: 'bg-[rgba(64,196,255,0.08)]' };
  }
}

/**
 * Single toast item with auto-dismiss, slide-in animation, and manual close.
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, message, variant, title, duration = 5000 } = toast;
  const [visible, setVisible] = useState(true);
  const { border, bg } = variantStyles(variant);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Allow exit animation to complete before calling onDismiss
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.25, ease: 'easeIn' } }}
          layout
          className={`flex items-start gap-3 rounded-xl border ${border} ${bg} px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm min-w-[300px] max-w-[420px]`}
        >
          {/* Icon */}
          <div className="mt-0.5">{variantIcon(variant)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-semibold text-sm text-text-primary leading-snug mb-0.5">{title}</p>
            )}
            <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="flex-shrink-0 mt-0.5 p-0.5 rounded-md text-text-muted hover:text-text-primary hover:bg-forge-700 transition-colors duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ToastContainer — rendered once at the app root via ToastProvider.
 * Renders all active toasts stacked in the top-right corner.
 */
export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
