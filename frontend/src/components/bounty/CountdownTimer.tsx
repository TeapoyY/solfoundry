import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  /** Size variant: 'sm' for cards, 'md' for detail page */
  size?: 'sm' | 'md';
  /** Whether to show the Clock icon */
  showIcon?: boolean;
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

function getTimeRemaining(deadline: string): TimeRemaining {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs: diff };
}

function getUrgencyLevel(totalMs: number): 'normal' | 'warning' | 'urgent' | 'expired' {
  if (totalMs <= 0) return 'expired';
  const hours = totalMs / (1000 * 60 * 60);
  if (hours < 1) return 'urgent';
  if (hours < 24) return 'warning';
  return 'normal';
}

const urgencyStyles = {
  normal: {
    dot: 'bg-status-info',
    text: 'text-text-secondary',
    label: 'text-text-muted',
  },
  warning: {
    dot: 'bg-status-warning',
    text: 'text-status-warning',
    label: 'text-status-warning/70',
  },
  urgent: {
    dot: 'bg-status-error animate-pulse',
    text: 'text-status-error',
    label: 'text-status-error/70',
  },
  expired: {
    dot: 'bg-text-muted',
    text: 'text-text-muted',
    label: 'text-text-muted',
  },
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * CountdownTimer — live countdown to a bounty deadline.
 *
 * Updates every second. Changes color as urgency increases:
 * - Normal (≥24h):  text-secondary
 * - Warning (<24h): text-status-warning
 * - Urgent (<1h):   text-status-error with pulsing dot
 * - Expired:        text-text-muted
 */
export function CountdownTimer({ deadline, size = 'sm', showIcon = true, className = '' }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => getTimeRemaining(deadline));
  const urgency = getUrgencyLevel(time.totalMs);
  const styles = urgencyStyles[urgency];

  useEffect(() => {
    // Sync in case deadline prop changed
    setTime(getTimeRemaining(deadline));
    const id = setInterval(() => {
      setTime(getTimeRemaining(deadline));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (urgency === 'expired') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${styles.text} ${className}`}>
        {showIcon && <Clock className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
        <span className={`font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>Expired</span>
      </span>
    );
  }

  if (size === 'sm') {
    // Compact: "2d 5h 32m" or "5h 32m" or "32m 15s"
    const parts: string[] = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0 || time.days > 0) parts.push(`${time.hours}h`);
    parts.push(`${time.minutes}m`);
    // Show seconds only when under 1 hour
    if (time.days === 0 && time.hours === 0) {
      parts[parts.length - 1] = `${time.minutes}m ${pad(time.seconds)}s`;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 ${styles.text} ${className}`}>
        {showIcon && (
          <>
            <Clock className="w-3.5 h-3.5" />
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          </>
        )}
        <span className="font-mono text-xs">
          {parts.join(' ')}
        </span>
      </span>
    );
  }

  // Medium size: detailed breakdown for bounty detail page
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {showIcon && (
        <div className={`p-1.5 rounded-md ${urgency === 'urgent' ? 'bg-status-error/10' : urgency === 'warning' ? 'bg-status-warning/10' : 'bg-forge-800'}`}>
          <Clock className={`${size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${styles.text}`} />
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {time.days > 0 && (
          <span className={`font-mono ${size === 'md' ? 'text-xl' : 'text-base'} font-semibold ${styles.text}`}>
            {time.days}
          </span>
        )}
        {time.days > 0 && (
          <span className={`text-xs ${styles.label}`}>d</span>
        )}
        {time.days > 0 && (
          <span className={`font-mono ${size === 'md' ? 'text-xl' : 'text-base'} font-semibold ${styles.text}`}>
            {pad(time.hours)}
          </span>
        )}
        {(time.days > 0 || time.hours > 0) && (
          <span className={`text-xs ${styles.label}`}>h</span>
        )}
        <span className={`font-mono ${size === 'md' ? 'text-xl' : 'text-base'} font-semibold ${styles.text}`}>
          {pad(time.minutes)}
        </span>
        <span className={`text-xs ${styles.label}`}>m</span>
        {time.days === 0 && time.hours === 0 && (
          <>
            <span className={`font-mono ${size === 'md' ? 'text-xl' : 'text-base'} font-semibold ${styles.text}`}>
              {pad(time.seconds)}
            </span>
            <span className={`text-xs ${styles.label}`}>s</span>
          </>
        )}
      </div>
      {/* Urgency dot */}
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
    </div>
  );
}
