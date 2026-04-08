import type { RewardToken } from '../types/bounty';

export function timeLeft(deadline: string): string {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) return 'Expired';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const dateMs = new Date(dateStr).getTime();
  const diff = now - dateMs;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function formatCurrency(amount: number, token: RewardToken): string {
  if (token === 'USDC') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString('en-US')} $${token}`;
}

export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Rust: '#CE422B',
  Solidity: '#363636',
  Go: '#00ADD8',
  React: '#61DAFB',
  Vue: '#4FC08D',
  Swift: '#FA7343',
  Kotlin: '#7F52FF',
  Java: '#B07219',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#CC342D',
  PHP: '#777BB4',
  Dart: '#00B4AB',
  Scala: '#DC322F',
  Haskell: '#5E5086',
  Elixir: '#6E4A7E',
  Clojure: '#DB5855',
  Shell: '#89E051',
};
