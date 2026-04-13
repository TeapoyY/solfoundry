import { useCallback, useState } from 'react';
import type { ToastData, ToastVariant } from '../components/ui/Toast';

let toastIdCounter = 0;

export type { ToastVariant };
export type { ToastData };

interface ToastState {
  toasts: ToastData[];
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const dismiss = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  const show = useCallback((
    variant: ToastVariant,
    title: string,
    message?: string,
    duration?: number,
  ) => {
    const id = `toast-${++toastIdCounter}`;
    const toast: ToastData = { id, variant, title, message, duration };
    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, toast].slice(-5), // max 5 toasts
    }));
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

  return {
    toasts: state.toasts,
    dismiss,
    show,
    success,
    error,
    warning,
    info,
  };
}
