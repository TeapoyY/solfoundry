import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  /** Show full breakdown: Xd Xh Xm Xs, or compact inline */
  variant?: 'full' | 'compact';
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

function computeTimeRemaining(deadline: string): TimeRemaining {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs: diff, expired: false };
}

function getUrgency(totalMs: number): 'normal' | 'warning' | 'urgent' {
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;
  if (totalMs <= ONE_HOUR) return 'urgent';
  if (totalMs <= ONE_DAY) return 'warning';
  return 'normal';
}

const urgencyStyles = {
  normal: {
    wrapper: 'text-emerald',
    icon: Clock,
    label: '',
  },
  warning: {
    wrapper: 'text-status-warning',
    icon: AlertTriangle,
    label: 'Warning',
  },
  urgent: {
    wrapper: 'text-status-error animate-pulse-glow',
    icon: Zap,
    label: 'Urgent',
  },
};

export function CountdownTimer({ deadline, variant = 'full', className = '' }: CountdownTimerProps) {
  const [time, setTime] = useState<TimeRemaining>(() => computeTimeRemaining(deadline));

  const tick = useCallback(() => {
    setTime(computeTimeRemaining(deadline));
  }, [deadline]);

  useEffect(() => {
    setTime(computeTimeRemaining(deadline));
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, tick]);

  if (time.expired) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-status-error font-mono text-sm font-semibold ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  const urgency = getUrgency(time.totalMs);
  const style = urgencyStyles[urgency];
  const Icon = style.icon;

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${style.wrapper} ${className}`}>
        <Icon className="w-3 h-3" />
        {time.days > 0 && `${time.days}d `}
        {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-1 ${style.wrapper} ${className}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4" />
        <span className="font-mono text-sm font-semibold">
          {time.days > 0 && `${time.days}d `}
          {String(time.hours).padStart(2, '0')}h{' '}
          {String(time.minutes).padStart(2, '0')}m{' '}
          {String(time.seconds).padStart(2, '0')}s
        </span>
      </div>
      {urgency !== 'normal' && (
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {style.label} — {urgency === 'warning' ? '< 24h remaining' : '< 1h remaining'}
        </span>
      )}
    </div>
  );
}
