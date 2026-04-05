/**
 * Utility functions for the SolFoundry frontend
 */

/**
 * Format a currency amount with token symbol
 */
export function formatCurrency(amount: number, token: 'USDC' | 'FNDRY'): string {
  if (token === 'FNDRY') {
    return `${(amount / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} FNDRY`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Returns a human-readable string describing the time remaining until a deadline
 */
export function timeLeft(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Returns a human-readable string describing how long ago a date was
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Color mapping for programming languages and skills
 */
export const LANG_COLORS: Record<string, string> = {
  // Popular languages
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Solidity: '#AA6746',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Lua: '#000080',

  // Web/Frontend
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  React: '#61dafb',
  Next: '#000000',

  // Frameworks
  Node: '#68a063',
  Express: '#000000',
  Django: '#092e20',
  Flask: '#000000',
  FastAPI: '#009688',
  Rails: '#cc0000',
  Spring: '#6db33f',
  Axum: '#3b2947',

  // Blockchain
  Anchor: '#14a3e8',
  Seahorse: '#7b2d8b',
  Cairo: '#1471b6',

  // Mobile
  React_Native: '#61dafb',
  Flutter: '#02569b',
  SwiftUI: '#F05138',

  // Data/ML
  PyTorch: '#EE4C2C',
  TensorFlow: '#FF6F00',
  Pandas: '#150458',
  NumPy: '#4dabcf',

  // DevOps/Infra
  Docker: '#2496ed',
  Kubernetes: '#326ce5',
  Terraform: '#7B42BC',
  Ansible: '#EE0000',
  Shell: '#89e051',
  Bash: '#89e051',

  // Databases
  SQL: '#e38c00',
  PostgreSQL: '#336791',
  MySQL: '#00758f',
  MongoDB: '#47a248',
  Redis: '#DC382D',

  // Cloud
  AWS: '#FF9900',
  GCP: '#4285F4',
  Azure: '#0078D4',

  // Other
  GraphQL: '#e10098',
  Web3: '#121d33',
  DeFi: '#1b4c7a',
  Solana: '#9945ff',
  Ethereum: '#627eea',
};
