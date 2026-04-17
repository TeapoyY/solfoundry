import { useState, useEffect, useRef } from 'react';
import { getUrgency, type UrgencyLevel } from '../lib/utils';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  urgency: UrgencyLevel;
  /** Compact string like "3d 5h" or "45m" or "Expired" */
  compact: string;
  /** Full string like "2 days, 3 hours, 45 minutes" */
  full: string;
}

/**
 * Returns real-time countdown state that updates every second.
 * Returns null if no deadline is provided.
 */
export function useCountdown(deadline: string | null | undefined): CountdownResult | null {
  const getCountdown = (): CountdownResult | null => {
    if (!deadline) return null;
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        urgency: 'expired',
        compact: 'Expired',
        full: 'Expired',
      };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const urgency = getUrgency(deadline);

    const compactParts: string[] = [];
    if (days > 0) compactParts.push(`${days}d`);
    if (hours > 0 || days > 0) compactParts.push(`${hours}h`);
    if (days === 0 && minutes > 0) compactParts.push(`${minutes}m`);
    if (days === 0 && hours === 0 && minutes === 0) compactParts.push(`${seconds}s`);
    const compact = compactParts.join(' ') || '0s';

    const fullParts: string[] = [];
    if (days > 0) fullParts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) fullParts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (days === 0 && minutes > 0) fullParts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (days === 0 && hours === 0 && minutes === 0) fullParts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    const full = fullParts.join(', ') || 'Expired';

    return { days, hours, minutes, seconds, isExpired: false, urgency, compact, full };
  };

  const [countdown, setCountdown] = useState<CountdownResult | null>(getCountdown);
  const deadlineRef = useRef(deadline);

  // Update ref when deadline changes
  if (deadline !== deadlineRef.current) {
    deadlineRef.current = deadline;
  }

  useEffect(() => {
    if (!deadline) {
      setCountdown(null);
      return;
    }

    // Set initial value immediately
    setCountdown(getCountdown());

    const interval = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineRef.current]);

  return countdown;
}
