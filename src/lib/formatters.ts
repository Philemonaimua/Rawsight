/**
 * Smart formatting utilities for Market Caps, Liquidity, Prices, and USD values.
 * Automatically displays market caps and figures in the appropriate scale:
 * - Hundreds ($120, $850)
 * - Thousands ($4.2K, $84.5K, $890K)
 * - Millions ($1.2M, $42.5M, $385M)
 * - Billions ($1.25B)
 */

export function formatMarketCap(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return '$0';
  }

  const absVal = Math.abs(value);

  // Billions
  if (absVal >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(absVal >= 10_000_000_000 ? 1 : 2);
    return `$${cleanTrailingZeros(formatted)}B`;
  }

  // Millions
  if (absVal >= 1_000_000) {
    // Over 100M: show no decimals ($385M, $642M, $980M)
    // 10M to 99M: show 1 decimal ($14.2M, $42.5M)
    // 1M to 9.9M: show 2 decimals ($1.45M, $8.90M)
    const decimals = absVal >= 100_000_000 ? 0 : absVal >= 10_000_000 ? 1 : 2;
    const formatted = (value / 1_000_000).toFixed(decimals);
    return `$${cleanTrailingZeros(formatted)}M`;
  }

  // Thousands
  if (absVal >= 1_000) {
    // Over 100K: show 0 decimals ($412K, $890K)
    // 10K to 99K: show 1 decimal ($84.5K, $55.2K)
    // 1K to 9.9K: show 1 decimal ($4.2K, $8.9K)
    const decimals = absVal >= 100_000 ? 0 : 1;
    const formatted = (value / 1_000).toFixed(decimals);
    return `$${cleanTrailingZeros(formatted)}K`;
  }

  // Hundreds & Sub-thousands ($100 - $999)
  if (absVal >= 100) {
    return `$${Math.round(value).toLocaleString()}`;
  }

  // Under $100
  if (absVal >= 1) {
    return `$${value.toFixed(2)}`;
  }

  // Micro cap (fractions of a dollar)
  return `$${value.toFixed(4)}`;
}

export function formatLiquidity(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return '$0';
  }

  const absVal = Math.abs(value);

  if (absVal >= 1_000_000) {
    const decimals = absVal >= 10_000_000 ? 1 : 2;
    const formatted = (value / 1_000_000).toFixed(decimals);
    return `$${cleanTrailingZeros(formatted)}M`;
  }

  if (absVal >= 1_000) {
    const decimals = absVal >= 100_000 ? 0 : 1;
    const formatted = (value / 1_000).toFixed(decimals);
    return `$${cleanTrailingZeros(formatted)}K`;
  }

  if (absVal >= 100) {
    return `$${Math.round(value).toLocaleString()}`;
  }

  return `$${value.toFixed(2)}`;
}

export function formatTokenPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price) || price === 0) {
    return '$0.00';
  }

  const abs = Math.abs(price);
  if (abs >= 100) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (abs >= 1) {
    return `$${price.toFixed(3)}`;
  }
  if (abs >= 0.01) {
    return `$${price.toFixed(4)}`;
  }
  if (abs >= 0.0001) {
    return `$${price.toFixed(6)}`;
  }
  return `$${price.toFixed(8)}`;
}

function cleanTrailingZeros(numStr: string): string {
  if (!numStr.includes('.')) return numStr;
  return numStr.replace(/\.?0+$/, '');
}
