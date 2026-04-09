import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadline: string;
  /** Compact mode for card-size displays (single line, smaller text) */
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeRemaining(deadline: string): TimeRemaining {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const total = Math.max(0, end - now);

  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1_000),
    total,
  };
}

function getUrgency(totalMs: number): 'normal' | 'warning' | 'urgent' | 'expired' {
  if (totalMs <= 0) return 'expired';
  const ONE_HOUR = 3_600_000;
  const ONE_DAY = 86_400_000;
  if (totalMs < ONE_HOUR) return 'urgent';
  if (totalMs < ONE_DAY) return 'warning';
  return 'normal';
}

const URGENCY_STYLES = {
  normal: {
    text: 'text-text-muted',
    dot: 'bg-emerald',
    label: '',
  },
  warning: {
    text: 'text-status-warning',
    dot: 'bg-status-warning',
    label: 'warning',
  },
  urgent: {
    text: 'text-status-error',
    dot: 'bg-status-error animate-pulse',
    label: 'urgent',
  },
  expired: {
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    label: 'expired',
  },
};

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="font-mono text-sm font-semibold tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] text-text-muted uppercase tracking-wide">{label}</span>
    </span>
  );
}

function Separator() {
  return <span className="font-mono text-sm text-text-muted/50 mx-0.5">:</span>;
}

/** Full countdown showing days / hours / minutes / seconds */
export function CountdownTimer({ deadline, compact = false }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => getTimeRemaining(deadline));
  const urgency = getUrgency(time.total);

  useEffect(() => {
    if (urgency === 'expired') return;
    const id = setInterval(() => setTime(getTimeRemaining(deadline)), 1_000);
    return () => clearInterval(id);
  }, [deadline, urgency]);

  const styles = URGENCY_STYLES[urgency];

  if (compact) {
    // Single-line compact display for bounty cards
    if (urgency === 'expired') {
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono ${styles.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          Expired
        </span>
      );
    }
    if (time.days > 0) {
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono ${styles.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          {time.days}d {time.hours}h {time.minutes}m
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-mono ${styles.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
      </span>
    );
  }

  // Full display for bounty detail page
  if (urgency === 'expired') {
    return (
      <div className={`inline-flex items-center gap-2 ${styles.text}`}>
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <span className="font-mono text-sm font-semibold">Expired</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${styles.text}`}>
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <div className="inline-flex items-center gap-1">
        {time.days > 0 && (
          <>
            <TimeUnit value={time.days} label="d" />
            <Separator />
          </>
        )}
        <TimeUnit value={time.hours} label="h" />
        <Separator />
        <TimeUnit value={time.minutes} label="m" />
        {time.days === 0 && (
          <>
            <Separator />
            <TimeUnit value={time.seconds} label="s" />
          </>
        )}
      </div>
    </div>
  );
}
