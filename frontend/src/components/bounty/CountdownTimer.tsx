import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { getUrgency, UrgencyLevel } from '../../lib/utils';

interface CountdownTimerProps {
  deadline: string;
  /** Show full labels instead of compact format */
  showLabels?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Callback when timer expires */
  onExpire?: () => void;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function parseTimeRemaining(deadline: string): TimeParts | null {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

const urgencyStyles: Record<UrgencyLevel, { text: string; bg: string; icon: React.ReactNode }> = {
  normal: {
    text: 'text-text-secondary',
    bg: 'bg-forge-800',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  warning: {
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  urgent: {
    text: 'text-status-error',
    bg: 'bg-status-error/10',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  expired: {
    text: 'text-text-muted',
    bg: 'bg-forge-800',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

const sizeStyles = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-1.5',
  lg: 'text-base gap-2',
};

const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="font-mono font-semibold tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    </span>
  );
}

function Separator({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'text-lg' : size === 'md' ? 'text-sm' : 'text-xs';
  return <span className={`${dim} font-mono font-bold opacity-40 -mt-2`}>:</span>;
}

export function CountdownTimer({
  deadline,
  showLabels = false,
  size = 'md',
  onExpire,
}: CountdownTimerProps) {
  const [parts, setParts] = useState<TimeParts | null>(parseTimeRemaining(deadline));
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const p = parseTimeRemaining(deadline);
      setParts(p);
      if (!p && !expired) {
        setExpired(true);
        onExpire?.();
      }
    };

    tick(); // immediate first tick
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, expired, onExpire]);

  const urgency = expired ? 'expired' : getUrgency(deadline);
  const style = urgencyStyles[urgency];
  const iconSize = iconSizes[size];

  if (expired || !parts) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.text} ${style.bg} ${sizeStyles[size]}`}
      >
        <Clock className={iconSize} />
        <span>Expired</span>
      </span>
    );
  }

  if (showLabels) {
    // Full labels: "2 days, 5 hours, 30 minutes"
    const chunks: string[] = [];
    if (parts.days > 0) chunks.push(`${parts.days} day${parts.days !== 1 ? 's' : ''}`);
    if (parts.hours > 0) chunks.push(`${parts.hours} hour${parts.hours !== 1 ? 's' : ''}`);
    if (parts.minutes > 0) chunks.push(`${parts.minutes} min${parts.minutes !== 1 ? 's' : ''}`);
    if (parts.days === 0 && parts.hours === 0) chunks.push(`${parts.seconds}s`);

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.text} ${style.bg} ${sizeStyles[size]}`}
      >
        {React.cloneElement(style.icon as React.ReactElement, { className: iconSize })}
        <span>{chunks.join(' ')}</span>
      </span>
    );
  }

  // Compact: DD:HH:MM:SS or HH:MM:SS or MM:SS
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs font-semibold tabular-nums ${style.text} ${style.bg} ${sizeStyles[size]}`}
    >
      {React.cloneElement(style.icon as React.ReactElement, { className: iconSize })}
      {parts.days > 0 && (
        <>
          <TimeUnit value={parts.days} label="d" />
          <Separator size={size} />
        </>
      )}
      {parts.hours > 0 || parts.days > 0 ? (
        <>
          <TimeUnit value={parts.hours} label="h" />
          <Separator size={size} />
        </>
      ) : null}
      <TimeUnit value={parts.minutes} label="m" />
      {parts.days === 0 && parts.hours === 0 && (
        <>
          <Separator size={size} />
          <TimeUnit value={parts.seconds} label="s" />
        </>
      )}
    </span>
  );
}
