import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface BountyCountdownProps {
  deadline: string | null | undefined;
  /** Compact mode shows "3d 5h" format — used on bounty cards */
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function computeTimeLeft(deadline: string): TimeLeft {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return { days, hours, minutes, seconds, totalMs: diff };
}

type UrgencyLevel = 'normal' | 'warning' | 'urgent';

function urgencyLevel(totalMs: number): UrgencyLevel {
  if (totalMs <= 0) return 'urgent';
  const hours = totalMs / 3_600_000;
  if (hours < 1) return 'urgent';
  if (hours < 24) return 'warning';
  return 'normal';
}

const urgencyStyles: Record<UrgencyLevel, { text: string; dot: string; pulse?: string }> = {
  normal: { text: 'text-text-muted', dot: 'bg-text-muted' },
  warning: { text: 'text-status-warning', dot: 'bg-status-warning' },
  urgent: { text: 'text-status-error', dot: 'bg-status-error', pulse: 'animate-pulse-glow' },
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Real-time countdown timer for bounty deadlines.
 * - Updates every second via setInterval
 * - Color urgency: normal (muted) > 24h | warning (amber) < 24h | urgent (red) < 1h
 * - Shows "Expired" when deadline passes
 * - Two display modes: compact (bounty cards) and full (detail page)
 */
export function BountyCountdown({ deadline, compact = false }: BountyCountdownProps) {
  const compute = useCallback(() => {
    if (!deadline) return null;
    return computeTimeLeft(deadline);
  }, [deadline]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    // Set immediately (not just after 1 second)
    setTimeLeft(compute());

    const interval = setInterval(() => {
      setTimeLeft(compute());
    }, 1_000);

    return () => clearInterval(interval);
  }, [deadline, compute]);

  if (!deadline) return null;
  if (!timeLeft) return null;

  const level = urgencyLevel(timeLeft.totalMs);
  const { text, dot, pulse } = urgencyStyles[level];

  if (timeLeft.totalMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-error">
        <Clock className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  if (compact) {
    // Compact: "3d 5h" or "5h 30m" or "45m" etc.
    let label: string;
    if (timeLeft.days > 0) {
      label = `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      label = `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else {
      label = `${timeLeft.minutes}m`;
    }

    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${text} ${pulse ?? ''}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  }

  // Full mode: segmented display for detail page
  const segments = [
    { value: timeLeft.days, unit: 'd' },
    { value: timeLeft.hours, unit: 'h' },
    { value: timeLeft.minutes, unit: 'm' },
    { value: timeLeft.seconds, unit: 's' },
  ];

  // Hide days segment when days === 0 to avoid "00d 05h 30m 15s"
  const showDays = timeLeft.days > 0;

  return (
    <div className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${text} ${pulse ?? ''}`}>
      <Clock className="w-3.5 h-3.5" />
      {showDays && (
        <span>
          {timeLeft.days}<span className="text-text-muted/50">{segments[0].unit}</span>
        </span>
      )}
      <span>
        {showDays ? pad(timeLeft.hours) : timeLeft.hours}<span className="text-text-muted/50">{showDays ? 'h' : 'h'}</span>
      </span>
      <span>:</span>
      <span>{pad(timeLeft.minutes)}<span className="text-text-muted/50">m</span></span>
      <span>:</span>
      <span>{pad(timeLeft.seconds)}<span className="text-text-muted/50">s</span></span>
    </div>
  );
}
