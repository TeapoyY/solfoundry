import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: {
    bg: 'bg-forge-900',
    border: 'border-emerald/30',
    icon: CheckCircle2,
    iconColor: 'text-emerald',
  },
  error: {
    bg: 'bg-forge-900',
    border: 'border-status-error/30',
    icon: XCircle,
    iconColor: 'text-status-error',
  },
  warning: {
    bg: 'bg-forge-900',
    border: 'border-status-warning/30',
    icon: AlertTriangle,
    iconColor: 'text-status-warning',
  },
  info: {
    bg: 'bg-forge-900',
    border: 'border-status-info/30',
    icon: Info,
    iconColor: 'text-status-info',
  },
};

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant = 'info', duration = 5000, onClose }: ToastProps) {
  const { bg, border, icon: Icon, iconColor } = VARIANT_STYLES[variant];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] max-w-sm ${bg} ${border}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className="flex-1 text-sm text-text-primary leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors duration-150 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
