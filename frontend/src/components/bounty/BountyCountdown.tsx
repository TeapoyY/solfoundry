import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { getTimeParts } from '../../lib/utils';

export type CountdownUrgency = 'normal' | 'warning' | 'urgent' | 'expired';

/** Determines the urgency level of a bounty deadline based on time remaining. */
function getUrgency(expired: boolean, days: number, hours: number): CountdownUrgency {
  if (expired) return 'expired';
  if (days === 0 && hours < 1) return 'urgent';
  if (days === 0) return 'warning';
  return 'normal';
}

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

interface BountyCountdownProps {
  deadline: string;
  /** Compact: single-line layout for cards. Default: false (detailed). */
  compact?: boolean;
  /** Badge variant: icon-only or icon+text inline style. Default: undefined. */
  variant?: 'badge';
  /** Show seconds tick. Default: false. */
  showSeconds?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Countdown timer for bounty deadlines with real-time updates and urgency levels.
 *
 * @param deadline - ISO date string for the bounty deadline
 * @param compact  - Single-line compact layout (e.g. inside a card). Default: false
 * @param variant  - 'badge' renders an inline icon+text style suitable for badges. Default: undefined
 * @param showSeconds - Include seconds in the countdown. Default: false
 * @param className - Additional CSS classes
 */

export function BountyCountdown({ deadline, compact = false, variant, showSeconds = false, className = '' }: BountyCountdownProps) {
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

  if (compact) {
    const icon = <Clock className="w-3.5 h-3.5" />;
    if (parts.expired) {
      if (variant === 'badge') {
        return (
          <span className={`inline-flex items-center gap-1 font-mono text-xs ${urgencyStyles[urgency].text}`}>
            <Clock className="w-3.5 h-3.5" />
          </span>
        );
      }
      return (
        <span className={`inline-flex items-center gap-1 font-mono text-xs ${urgencyStyles[urgency].text}`}>
          {icon}
          Expired
        </span>
      );
    }
  }

  const icon = urgencyStyles[urgency].icon;
  const textStyle = urgencyStyles[urgency].text;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${urgencyStyles[urgency].bg} ${urgencyStyles[urgency].border} ${className}`}
    >
      <span className={textStyle}>{icon}</span>
      {parts.expired ? (
        <span className={`font-mono text-sm font-medium ${textStyle}`}>Expired</span>
      ) : (
        <span className={`font-mono text-sm font-medium ${textStyle}`}>
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
