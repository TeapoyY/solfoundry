/**
 * useToast — Convenient hook for triggering toast notifications.
 * Usage: const toast = useToast(); toast.success('Saved!');
 */
import { useToastContext } from '../contexts/ToastContext';

export function useToast() {
  return useToastContext();
}
