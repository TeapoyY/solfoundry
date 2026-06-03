import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { getTimeParts } from '../../lib/utils';

export type CountdownUrgency = 'normal' | 'warning' | 'urgent' | 'expired';

/**
 * Determines urgency level based on time remaining.
 * @param expired - Whether the deadline has passed.
 * @param days - Full days remaining.
 * @param hours - Hours remaining within the current day.
 * @returns Urgency level: expired > urgent > warning > normal.
 */
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
  /** Show seconds tick. Default: false. */
  showSeconds?: boolean;
  /** Additional CSS classes. */
  className?: string;
  /** Visual variant. 'badge' renders a compact pill badge. Default: 'default'. */
  variant?: 'default' | 'badge';
}

/**
 * Live countdown timer for a bounty deadline.
 * Updates every second; adapts styling to urgency level (normal → warning → urgent → expired).
 * Renders a compact inline span (compact=true) or a full badge block.
 *
 * @param deadline - ISO-8601 deadline string.
 * @param compact  - Single-line layout for cards vs. full badge layout. Default: false.
 * @param showSeconds - Render seconds alongside minutes. Default: false.
 * @param className - Additional CSS classes to apply to the container.
 * @param variant  - Visual style: 'default' (full block) or 'badge' (compact pill). Default: 'default'.
 */
export function BountyCountdown({
  deadline,
  compact = false,
  showSeconds = false,
  className = '',
  variant = 'default',
}: BountyCountdownProps) {
  const [parts, setParts] = useState(() => getTimeParts(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(getTimeParts(deadline));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const urgency = getUrgency(parts.expired, parts.days, parts.hours);
  const style = urgencyStyles[urgency];

  // Badge variant: compact pill badge — always applies full styling even when expired
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.border} ${style.text}`}
      >
        {style.icon}
        {parts.expired ? 'Expired' : `${parts.days}d ${parts.hours}h`}
      </span>
    );
  }

  // Compact variant: single-line inline span
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs ${style.text}`}>
        {style.icon}
        {parts.expired ? 'Expired' : `${parts.days}d ${parts.hours}h ${parts.minutes}m`}
      </span>
    );
  }

  // Default: full badge block
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border} ${className}`}
    >
      <span className={style.text}>{style.icon}</span>
      <span className={`font-mono text-sm font-medium ${style.text}`}>
        {parts.expired ? (
          'Expired'
        ) : (
          <>
            {parts.days > 0 && (
              <span>
                {parts.days}
                <span className="text-xs ml-0.5 mr-1">d</span>
              </span>
            )}
            {parts.days > 0 && parts.hours > 0 && (
              <span>
                {parts.hours}
                <span className="text-xs ml-0.5 mr-1">h</span>
              </span>
            )}
            {parts.days === 0 && (
              <span>
                {parts.hours}
                <span className="text-xs ml-0.5 mr-1">h</span>
              </span>
            )}
            <span>
              {parts.minutes}
              <span className="text-xs ml-0.5 mr-1">m</span>
            </span>
            {showSeconds && (
              <span>
                {parts.seconds}
                <span className="text-xs ml-0.5">s</span>
              </span>
            )}
          </>
        )}
      </span>
    </div>
  );
}