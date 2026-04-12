/**
 * Returns a human-readable string of time remaining until deadline.
 * e.g. "3d 5h", "12h 30m", "45m", "Expired"
 */
export function timeLeft(deadline: string | null | undefined): string {
  if (!deadline) return 'No deadline';
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Returns an urgency level based on time remaining.
 */
export type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'expired';

export function getUrgency(deadline: string | null | undefined): UrgencyLevel {
  if (!deadline) return 'normal';
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return 'expired';
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return 'urgent';
  if (hours < 24) return 'warning';
  return 'normal';
}

/**
 * Format reward amount with token symbol.
 */
export function formatCurrency(amount: number, token: string): string {
  const symbol = token === 'USDC' ? '$' : '';
  if (amount >= 1000) {
    return `${symbol}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${token}`;
  }
  return `${symbol}${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token}`;
}

/**
 * Language/skill to color mapping.
 */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Solidity: '#AA56F0',
  Rust: '#CE422B',
  Python: '#3572A5',
  Go: '#00ADD8',
  Java: '#B07219',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  HTML: '#E34C26',
  CSS: '#1572B6',
  Shell: '#89E051',
  Dockerfile: '#384D54',
  Nix: '#7EBAE4',
  Dart: '#00B4AB',
  Lua: '#000080',
  Zig: '#EC915C',
  Move: '#4FC3F7',
};

/**
 * Returns a relative time string (e.g. "2h ago", "3d ago").
 */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
