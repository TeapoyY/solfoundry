// Time formatting utilities

/**
 * Returns a human-readable string describing time remaining until deadline.
 * e.g. "5d 3h", "12h 30m", "45m", "Expired"
 */
export function timeLeft(deadline: string | null | undefined): string {
  if (!deadline) return '—';
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Returns a human-readable string describing time since date.
 * e.g. "just now", "5m ago", "2h ago", "3d ago"
 */
export function timeAgo(date: string | null | undefined): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 0) return 'just now';
  const totalMinutes = Math.floor(diff / (1000 * 60));
  if (totalMinutes < 1) return 'just now';
  if (totalMinutes < 60) return `${totalMinutes}m ago`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours}h ago`;
  const totalDays = Math.floor(totalHours / 24);
  if (totalDays < 7) return `${totalDays}d ago`;
  // For older dates, show the actual date
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a reward amount with its token symbol.
 * e.g. 1000000, "FNDRY" → "1,000,000 FNDRY"
 */
export function formatCurrency(amount: number, token: string = 'FNDRY'): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M ${token}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K ${token}`;
  }
  return `${amount.toLocaleString('en-US')} ${token}`;
}

/**
 * Maps programming language names to their brand colors.
 * Used for skill/language dots on bounty cards.
 */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Solidity: '#aa81fc',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  React: '#61dafb',
  'React Native': '#61dafb',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  R: '#198CE7',
  MATLAB: '#e16737',
  Julia: '#a270ba',
  Scala: '#c22d40',
  Clojure: '#db5855',
  Perl: '#0298c3',
  TypeScriptReact: '#3178c6',
};
