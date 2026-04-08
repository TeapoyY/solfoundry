import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface BountyCountdownProps {
  deadline: string;
  /** Show just the time-left string, or the full component with label */
  variant?: 'inline' | 'full';
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  isExpired: boolean;
}

function computeTimeLeft(deadline: string): TimeRemaining {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = Math.max(0, end - now);

  if (diff === 0) {
    return { days: 0, hours: 0, minutes: 0, totalMs: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    totalMs: diff,
    isExpired: false,
  };
}

function urgencyLevel(totalMs: number): 'normal' | 'warning' | 'urgent' {
  const ONE_HOUR = 3_600_000;
  const ONE_DAY = 86_400_000;
  if (totalMs < ONE_HOUR) return 'urgent';
  if (totalMs < ONE_DAY) return 'warning';
  return 'normal';
}

const URGENCY_STYLES = {
  normal: 'text-text-muted',
  warning: 'text-status-warning',
  urgent: 'text-status-error',
};

const URGENCY_DOT = {
  normal: 'bg-text-muted',
  warning: 'bg-status-warning',
  urgent: 'bg-status-error animate-pulse',
};

/**
 * Real-time countdown timer for bounty deadlines.
 * Updates every 30 seconds for efficiency.
 */
export function BountyCountdown({ deadline, variant = 'inline', className = '' }: BountyCountdownProps) {
  const [time, setTime] = useState<TimeRemaining>(() => computeTimeLeft(deadline));

  useEffect(() => {
    // Update every 30 seconds
    const id = setInterval(() => {
      setTime(computeTimeLeft(deadline));
    }, 30_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (time.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono text-text-muted ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  const level = urgencyLevel(time.totalMs);

  if (variant === 'inline') {
    const parts: string[] = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0 || time.days > 0) parts.push(`${time.hours}h`);
    parts.push(`${time.minutes}m`);
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono ${URGENCY_STYLES[level]} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[level]}`} />
        {parts.join(' ')} left
      </span>
    );
  }

  // Full variant: days / hours / minutes breakdown
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-mono ${URGENCY_STYLES[level]} ${className}`}>
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${URGENCY_DOT[level]}`} />
      {time.days > 0 && <span>{time.days}d</span>}
      {time.hours > 0 && <span>{time.hours}h</span>}
      <span>{time.minutes}m</span>
      <span className="text-text-muted">left</span>
    </div>
  );
}
