import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadline: string | null | undefined;
  /** Show full breakdown: "5d 3h 20m 10s". Otherwise compact: "5d 3h". */
  compact?: boolean;
  /** Override text color for urgency. Defaults to theme-aware styling. */
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  urgent: boolean;    // < 1 hour
  warning: boolean;   // < 24 hours
}

function computeRemaining(deadline: string | null | undefined): TimeRemaining {
  if (!deadline) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, urgent: false, warning: false };
  }
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = Math.max(0, end - now);

  if (diff === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, urgent: false, warning: false };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalHours = diff / (1000 * 60 * 60);
  const urgent = totalHours < 1;
  const warning = totalHours < 24;

  return { days, hours, minutes, seconds, expired: false, urgent, warning };
}

function urgencyClass(remaining: TimeRemaining): string {
  if (remaining.expired) return 'text-text-muted';
  if (remaining.urgent) return 'text-status-error';
  if (remaining.warning) return 'text-status-warning';
  return 'text-text-secondary';
}

function urgencyDotClass(remaining: TimeRemaining): string {
  if (remaining.expired) return 'bg-text-muted';
  if (remaining.urgent) return 'bg-status-error animate-pulse-glow';
  if (remaining.warning) return 'bg-status-warning';
  return 'bg-text-muted';
}

export function CountdownTimer({ deadline, compact = false, className = '' }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() => computeRemaining(deadline));

  useEffect(() => {
    setRemaining(computeRemaining(deadline));
    if (!deadline) return;

    const interval = setInterval(() => {
      setRemaining(computeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining.expired) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`w-2 h-2 rounded-full ${urgencyDotClass(remaining)}`} />
        <span className="text-text-muted font-mono text-xs">Expired</span>
      </span>
    );
  }

  const colorClass = urgencyClass(remaining);

  if (compact) {
    // Compact: "5d 3h" or "2h 15m"
    let text: string;
    if (remaining.days > 0) {
      text = `${remaining.days}d ${remaining.hours}h`;
    } else if (remaining.hours > 0) {
      text = `${remaining.hours}h ${remaining.minutes}m`;
    } else {
      text = `${remaining.minutes}m ${remaining.seconds}s`;
    }
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`w-2 h-2 rounded-full ${urgencyDotClass(remaining)}`} />
        <span className={`font-mono text-xs ${colorClass}`}>{text}</span>
      </span>
    );
  }

  // Full: "5d 3h 20m 10s"
  const parts: string[] = [];
  if (remaining.days > 0) parts.push(`${remaining.days}d`);
  if (remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.hours}h`);
  if (remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.minutes}m`);
  parts.push(`${remaining.seconds}s`);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${urgencyDotClass(remaining)}`} />
      <span className={`font-mono text-xs ${colorClass}`}>{parts.join(' ')}</span>
    </span>
  );
}
