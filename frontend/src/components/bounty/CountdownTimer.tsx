import React from 'react';
import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';

export type TimerVariant = 'compact' | 'full' | 'badge';

interface CountdownTimerProps {
  deadline: string | null | undefined;
  variant?: TimerVariant;
  /** Show icon alongside time */
  showIcon?: boolean;
  className?: string;
}

const URGENCY_COLORS: Record<string, string> = {
  normal: 'text-text-muted',
  warning: 'text-status-warning',
  urgent: 'text-status-error',
  expired: 'text-text-muted',
};

const BADGE_COLORS: Record<string, string> = {
  normal: 'bg-forge-800 text-text-muted',
  warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
  urgent: 'bg-status-error/10 text-status-error border border-status-error/20',
  expired: 'bg-forge-800 text-text-muted',
};

export function CountdownTimer({
  deadline,
  variant = 'compact',
  showIcon = true,
  className = '',
}: CountdownTimerProps) {
  const countdown = useCountdown(deadline);

  if (!countdown) return null;

  const { compact, urgency } = countdown;

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${BADGE_COLORS[urgency]} ${className}`}
        title={countdown.full}
      >
        {showIcon && <Clock className="w-3 h-3" />}
        {compact}
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-sm ${URGENCY_COLORS[urgency]} ${className}`}
        title={countdown.full}
      >
        {showIcon && <Clock className="w-3.5 h-3.5" />}
        {countdown.full}
      </span>
    );
  }

  // compact (default)
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs ${URGENCY_COLORS[urgency]} ${className}`}
      title={countdown.full}
    >
      {showIcon && <Clock className="w-3.5 h-3.5" />}
      {compact}
    </span>
  );
}
