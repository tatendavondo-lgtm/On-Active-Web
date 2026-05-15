export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatZIG(amount: number): string {
  return `ZIG ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

export function convertToLocal(amountUSD: number, rate: number): number {
  return Math.round(amountUSD * rate * 100) / 100;
}

export function convertToUSD(amountLocal: number, rate: number): number {
  return Math.round((amountLocal / rate) * 100) / 100;
}
