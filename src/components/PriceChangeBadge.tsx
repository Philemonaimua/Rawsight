import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPriceChange24h } from '../utils/formatters';

interface PriceChangeBadgeProps {
  change24h: number | undefined | null;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriceChangeBadge: React.FC<PriceChangeBadgeProps> = ({
  change24h,
  showIcon = true,
  size = 'sm',
  className = '',
}) => {
  const { text, isPositive, isNegative } = formatPriceChange24h(change24h);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-1.5 font-black',
  }[size];

  const colorClasses = isPositive
    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
    : isNegative
    ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
    : 'text-zinc-400 bg-zinc-900 border-zinc-700/50';

  return (
    <span
      className={`inline-flex items-center rounded font-mono font-bold border tracking-tight ${sizeClasses} ${colorClasses} ${className}`}
      title={`24h Price Change: ${text}`}
    >
      {showIcon && (
        isPositive ? (
          <TrendingUp className="w-3 h-3 shrink-0 text-emerald-400" />
        ) : isNegative ? (
          <TrendingDown className="w-3 h-3 shrink-0 text-rose-400" />
        ) : (
          <Minus className="w-3 h-3 shrink-0 text-zinc-400" />
        )
      )}
      <span>{text}</span>
    </span>
  );
};
