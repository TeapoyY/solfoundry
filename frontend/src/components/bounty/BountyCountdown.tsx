import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { getTimeParts } from '../../lib/utils';

/**
 * Urgency level for bounty deadline countdown.
 * Determines visual styling: normal → warning → urgent → expired.
 */
export type CountdownUrgency = 'normal' | 'warning' | 'urgent' | 'expired';

/**
 * Determine urgency level based on expiration and time remaining.
 * Used to apply visual styling (normal/warning/urgent/expired).
 *
 * @param expired   - Whether the deadline has passed.
 * @param days      - Full days remaining.
 * @param hours     - Hours remaining in the current day.
 * @returns The appropriate urgency level.
 */
function getUrgency(expired: boolean, days: number, hours: number): CountdownUrgency {
  if (expired) return 'expired';
  if (days === 0 && hours < 1) return 'urgent';
  if (days === 0) return 'warning';
  return 'normal';
}

/** Styles for each urgency level: icon, text color, background, and border. */
const urgencyStyles: Record<CountdownUrgency, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
  normal: {
    text: 'text-text-muted',
    bg: 'bg-forge-800',
    border: 'border-border',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  warning: {
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  urgent: {
    text: 'text-status-error',
    bg: 'bg-status-error/10',
    border: 'border-status-error/30',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  expired: {
    text: 'text-text-muted',
    bg: 'bg-forge-800',
    border: 'border-border',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

/**
 * Live countdown timer for bounty deadlines.
 *
 * Renders a real-time countdown (days/hours/minutes) that updates every second.
 * Visual urgency escalates as the deadline approaches: normal → warning → urgent → expired.
 *
 * @param deadline    - ISO date string for the bounty deadline.
 * @param compact     - Compact single-line layout for cards. Default: false.
 * @param showSeconds - Show seconds tick. Default: false.
 * @param variant     - 'default' renders a full countdown box; 'badge' renders a compact inline badge.
 * @param className   - Additional CSS class names.
 */
export function BountyCountdown({ deadline, compact = false, showSeconds = false, variant = 'default', className = '' }: BountyCountdownProps) {
  const [parts, setParts] = useState(() => getTimeParts(deadline));

  useEffect(() => {
    // Update every second for real-time countdown
    const interval = setInterval(() => {
      setParts(getTimeParts(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const urgency = getUrgency(parts.expired, parts.days, parts.hours);
  const style = urgencyStyles[urgency];

  if (compact || variant === 'badge') {
    const displayStyle = parts.expired ? urgencyStyles['expired'] : style;
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs ${displayStyle.text}${className ? ` ${className}` : ''}`}>
        {displayStyle.icon}
        {parts.expired ? 'Expired' : `${parts.days}d ${parts.hours}h ${parts.minutes}m`}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border} ${className}`}
    >
      <span className={style.text}>{style.icon}</span>
      {parts.expired ? (
        <span className={`font-mono text-sm font-medium ${style.text}`}>Expired</span>
      ) : (
        <span className={`font-mono text-sm font-medium ${style.text}`}>
          {parts.days > 0 && <span>{parts.days}<span className="text-xs ml-0.5 mr-1">d</span></span>}
          {parts.days > 0 && parts.hours > 0 && <span>{parts.hours}<span className="text-xs ml-0.5 mr-1">h</span></span>}
          {parts.days === 0 && <span>{parts.hours}<span className="text-xs ml-0.5 mr-1">h</span></span>}
          <span>{parts.minutes}<span className="text-xs ml-0.5 mr-1">m</span></span>
          {showSeconds && <span>{parts.seconds}<span className="text-xs ml-0.5">s</span></span>}
        </span>
      )}
    </div>
  );
}
