export function formatTokenPrice(price: number): string {
  if (!price || price === 0) return '$0.00';
  if (price < 0.000001) return `$${price.toExponential(4)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

export function formatPriceChange24h(change: number | undefined | null): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  rawPercent: number;
} {
  const val = typeof change === 'number' && !isNaN(change) ? change : 0;
  const isPositive = val > 0;
  const isNegative = val < 0;
  const absFormatted = Math.abs(val).toFixed(2);
  const text = isPositive ? `+${absFormatted}%` : isNegative ? `-${absFormatted}%` : `+0.00%`;
  return {
    text,
    isPositive,
    isNegative,
    rawPercent: val,
  };
}

export function formatMarketCap(mcap: number): string {
  if (!mcap || mcap === 0) return '$0';
  if (mcap >= 1_000_000_000) return `$${(mcap / 1_000_000_000).toFixed(2)}B`;
  if (mcap >= 1_000_000) return `$${(mcap / 1_000_000).toFixed(2)}M`;
  if (mcap >= 1_000) return `$${(mcap / 1_000).toFixed(1)}k`;
  return `$${mcap.toFixed(0)}`;
}

export function formatLiquidity(liq: number): string {
  if (!liq || liq === 0) return '$0';
  if (liq >= 1_000_000) return `$${(liq / 1_000_000).toFixed(2)}M`;
  if (liq >= 1_000) return `$${(liq / 1_000).toFixed(1)}k`;
  return `$${liq.toFixed(0)}`;
}

export function formatAddressDisplay(addr: string, prefixLen: number = 6, suffixLen: number = 4): string {
  if (!addr) return '';
  if (addr.length <= prefixLen + suffixLen) return addr;
  return `${addr.slice(0, prefixLen)}...${addr.slice(-suffixLen)}`;
}
