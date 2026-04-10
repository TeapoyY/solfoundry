import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { ToastContainer, Toast, ToastVariant } from './Toast';

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const { variant = 'info', duration = DEFAULT_DURATION } = options;
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]);

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    }
  }, [dismiss]);

  const success = useCallback((message: string, duration = DEFAULT_DURATION) => {
    toast(message, { variant: 'success', duration });
  }, [toast]);

  const error = useCallback((message: string, duration = DEFAULT_DURATION) => {
    toast(message, { variant: 'error', duration });
  }, [toast]);

  const warning = useCallback((message: string, duration = DEFAULT_DURATION) => {
    toast(message, { variant: 'warning', duration });
  }, [toast]);

  const info = useCallback((message: string, duration = DEFAULT_DURATION) => {
    toast(message, { variant: 'info', duration });
  }, [toast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}
