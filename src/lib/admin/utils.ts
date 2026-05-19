// ─── On Active Admin Hub — Shared Utilities ──────────────────────────────────

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatZiG(usdAmount: number, zigRate: number): string {
  const zigAmount = usdAmount * zigRate;
  return `ZiG ${new Intl.NumberFormat('en-ZW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(zigAmount))}`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateStockoutDays(stock: number, dailyVelocity: number): number | null {
  if (dailyVelocity <= 0) return null;
  return Math.floor(stock / dailyVelocity);
}

export type StockoutUrgency = 'safe' | 'warning' | 'critical';

export function getStockoutUrgency(days: number | null): StockoutUrgency {
  if (days === null) return 'safe';
  if (days < 7) return 'critical';
  if (days < 14) return 'warning';
  return 'safe';
}

export function calculateSuggestedRestock(dailyVelocity: number, days = 30): number {
  return Math.ceil(dailyVelocity * days);
}

export function getPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
