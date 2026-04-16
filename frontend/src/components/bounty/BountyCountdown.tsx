import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'expired';

interface BountyCountdownProps {
  deadline: string | null | undefined;
  /** Show only the compact text (e.g. on cards). Default false. */
  compact?: boolean;
  /** Custom class override */
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcTimeRemaining(deadline: string | null | undefined): TimeRemaining | null {
  if (!deadline) return null;
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: totalSeconds % 60,
    totalMs: diff,
  };
}

function getUrgency(totalMs: number): UrgencyLevel {
  if (totalMs <= 0) return 'expired';
  const hours = totalMs / (1000 * 60 * 60);
  if (hours < 1) return 'urgent';
  if (hours < 24) return 'warning';
  return 'normal';
}

const URGENCY_STYLES: Record<UrgencyLevel, { text: string; dot: string; label: string }> = {
  normal: {
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    label: '',
  },
  warning: {
    text: 'text-status-warning',
    dot: 'bg-status-warning',
    label: 'text-status-warning',
  },
  urgent: {
    text: 'text-status-error',
    dot: 'bg-status-error animate-pulse',
    label: 'text-status-error',
  },
  expired: {
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    label: 'text-text-muted',
  },
};

/** Formats a single time unit with optional label */
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 font-mono">
      <span className="text-sm font-semibold tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-60">{label}</span>
    </span>
  );
}

/**
 * A real-time countdown timer for bounty deadlines.
 * Shows days/hours/minutes/seconds, updates every second.
 * Color changes: normal → warning (<24h) → urgent (<1h) → expired.
 */
export function BountyCountdown({ deadline, compact = false, className = '' }: BountyCountdownProps) {
  const [time, setTime] = useState<TimeRemaining | null>(() => calcTimeRemaining(deadline));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!deadline) return;

    const tick = () => setTime(calcTimeRemaining(deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // SSR guard: render nothing until mounted to avoid hydration mismatch
  if (!mounted || time === null) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">--:--</span>
      </span>
    );
  }

  const urgency = getUrgency(time.totalMs);
  const styles = URGENCY_STYLES[urgency];

  // Expired state
  if (urgency === 'expired') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${styles.text} ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-mono font-semibold uppercase tracking-wide">Expired</span>
      </span>
    );
  }

  // Compact: single-line "5d 3h" style
  if (compact) {
    const parts: string[] = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0 || time.days > 0) parts.push(`${time.hours}h`);
    if (time.days === 0) parts.push(`${time.minutes}m`);

    return (
      <span className={`inline-flex items-center gap-1 ${styles.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
        <span className="text-xs font-mono tabular-nums">{parts.join(' ') || `${time.minutes}m`}</span>
      </span>
    );
  }

  // Full countdown: d h m s
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${styles.text}`} />
      <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${styles.text}`}>
        {time.days > 0 && (
          <>
            <TimeUnit value={time.days} label="d" />
            <span className="text-xs opacity-40 mx-0.5">:</span>
          </>
        )}
        <TimeUnit value={time.hours} label="h" />
        <span className="text-xs opacity-40 mx-0.5">:</span>
        <TimeUnit value={time.minutes} label="m" />
        {time.days === 0 && (
          <>
            <span className="text-xs opacity-40 mx-0.5">:</span>
            <TimeUnit value={time.seconds} label="s" />
          </>
        )}
      </span>
      {/* Urgency dot */}
      <span className={`w-1.5 h-1.5 rounded-full ml-1 flex-shrink-0 ${styles.dot}`} />
    </span>
  );
}
