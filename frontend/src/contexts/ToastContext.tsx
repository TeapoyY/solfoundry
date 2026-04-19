import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Toast, ToastVariant } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';

/**
 * Arguments for the toast() function exposed by ToastContext.
 */
interface ToastArgs {
  message: string;
  variant?: ToastVariant;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (args: ToastArgs) => void;
  dismiss: (id: string) => void;
  /** Convenience helpers for each variant */
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _idCounter = 0;
function nextId() {
  return `toast-${++_idCounter}-${Date.now()}`;
}

/**
 * ToastProvider — wrap your app root with this to enable toast notifications.
 * Place it above <Router> so it persists across page navigations.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, variant = 'info', title, duration }: ToastArgs) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, variant, title, duration }]);
    },
    []
  );

  const success = useCallback((message: string, title?: string) => {
    addToast({ message, variant: 'success', title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ message, variant: 'error', title, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ message, variant: 'warning', title });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ message, variant: 'info', title });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, dismiss, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * useToast — access the toast context from any component.
 * Throws if used outside of a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
