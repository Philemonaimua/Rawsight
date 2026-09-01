import React, { useState } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  Flame, 
  X, 
  Crosshair, 
  Radio, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { TradePosition } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { formatMarketCap, formatLiquidity, formatTokenPrice } from '../lib/formatters';

interface ActivePositionsProps {
  positions: TradePosition[];
  onManualClose: (positionId: string) => void;
  takeProfitTargetPercent: number;
  onAddManualBuy?: () => void;
  maxAutoSlots?: number;
}

export const ActivePositions: React.FC<ActivePositionsProps> = ({
  positions,
  onManualClose,
  takeProfitTargetPercent,
  onAddManualBuy,
  maxAutoSlots = 6,
}) => {
  const [copiedCa, setCopiedCa] = useState<string | null>(null);

  const handleCopyCa = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCa(ca);
    setTimeout(() => setCopiedCa(null), 1800);
  };

  const isAutoCapacityFilled = positions.length >= maxAutoSlots;

  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-4 sm:p-5 mb-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D] shrink-0">
            <Radio className="w-4 h-4 text-[#D9F99D] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Active Vault Positions
              </h2>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
                {positions.length} ACTIVE POSITIONS
              </span>
              {isAutoCapacityFilled && (
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  {maxAutoSlots}/{maxAutoSlots} AUTO SLOTS FILLED • MANUAL BUY OPEN
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Autonomous execution tracks up to {maxAutoSlots} slots. Manual memecoin buys can be added anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAddManualBuy && (
            <button
              onClick={onAddManualBuy}
              className="px-3 py-1.5 min-h-[44px] rounded-md border border-[#D9F99D]/50 text-xs font-bold uppercase tracking-wider text-black bg-[#D9F99D] hover:bg-[#bef264] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#D9F99D]/10"
              title="Add a manual memecoin buy beyond automated slots"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>+ Add Manual Buy</span>
            </button>
          )}
          <span className="px-2 py-1 rounded-sm border border-[#D9F99D]/30 text-[9px] uppercase tracking-wider text-[#D9F99D] bg-[#D9F99D]/5">
            TP: +{takeProfitTargetPercent}%
          </span>
          <span className="px-2 py-1 rounded-sm border border-[#D9F99D]/30 text-[9px] uppercase tracking-wider text-[#D9F99D] bg-[#D9F99D]/5">
            LP FILTER: ≥80%
          </span>
        </div>
      </div>

      {/* Position Cards / Grid */}
      {positions.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-600">
            <Crosshair className="w-6 h-6" />
          </div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-zinc-300">
            Vault Standing By • Scanning Multi-Chain Pools (Lowest to Highest MCAP)
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
            The scanner arranges meme discoveries from lowest market cap to highest with LP locked ≥80%. Up to 6 automated slots execute automatically, and manual buys can be initiated at any time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {positions.map((pos, idx) => {
            const chainConfig = CHAINS_CONFIG[pos.chain];
            const isProfit = pos.currentPnlPercent >= 0;
            const progressToTp = Math.min(
              100,
              Math.max(0, (pos.currentPnlPercent / pos.takeProfitTargetPercent) * 100)
            );
            const slotNum = pos.slotNumber || (positions.length - idx);
            const isManual = pos.isManualBuy || slotNum > maxAutoSlots;

            return (
              <div
                key={pos.id}
                className="bg-[#050505] border border-[#D9F99D]/20 hover:border-[#D9F99D]/40 rounded-xl p-4 transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Top Row: Token, Chain, and Close Action */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#D9F99D]/10 border border-[#D9F99D]/30 flex items-center justify-center font-bold text-sm text-[#D9F99D] shrink-0">
                        {pos.token.symbol.replace('$', '').slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-base tracking-tight">
                            {pos.token.symbol}
                          </span>

                          {/* Slot Badge */}
                          <span className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-bold border ${
                            isManual 
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' 
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {isManual ? `Slot ${slotNum} (Manual Buy)` : `Slot ${slotNum}/6 (Auto)`}
                          </span>

                          {/* CA Badge beside token */}
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#0A0A0A] border border-white/10 hover:border-[#D9F99D]/40 transition-colors">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">CA:</span>
                            <span className="text-[10px] text-zinc-300 font-mono">
                              {pos.token.contractAddress.slice(0, 4)}...{pos.token.contractAddress.slice(-4)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyCa(pos.token.contractAddress, e)}
                              className="text-zinc-400 hover:text-[#D9F99D] p-1 transition-colors cursor-pointer"
                              title="Copy Contract Address"
                            >
                              {copiedCa === pos.token.contractAddress ? (
                                <Check className="w-3 h-3 text-[#D9F99D]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {chainConfig && (
                              <a
                                href={`${chainConfig.explorerUrl}/token/${pos.token.contractAddress}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-500 hover:text-[#D9F99D] p-1 transition-colors"
                                title={`View on ${chainConfig.name} Explorer`}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider border border-[#D9F99D]/30 bg-[#D9F99D]/10 text-[#D9F99D]">
                            {chainConfig?.name || pos.chain.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate max-w-[260px]">
                          {pos.token.name} • <span className="text-zinc-300 font-semibold">MC: {formatMarketCap(pos.token.mcap)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Manual Close Button */}
                    <button
                      id={`btn-close-${pos.id}`}
                      onClick={() => onManualClose(pos.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider text-zinc-400 bg-[#0A0A0A] border border-white/10 hover:border-red-500/50 hover:text-red-300 transition-colors cursor-pointer"
                      title="Liquidate position immediately"
                    >
                      <X className="w-4 h-4" />
                      <span>Exit</span>
                    </button>
                  </div>

                  {/* Price and Live PnL Row */}
                  <div className="grid grid-cols-2 gap-3 my-3 p-3 rounded-lg bg-[#0A0A0A] border border-white/5">
                    <div>
                      <span className="text-[10px] opacity-40 uppercase tracking-wider block">
                        ENTRY / CURRENT
                      </span>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {formatTokenPrice(pos.entryPrice)}
                      </div>
                      <div className="text-sm font-bold text-white">
                        {formatTokenPrice(pos.currentPrice)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] opacity-40 uppercase tracking-wider block">
                        UNREALIZED PnL
                      </span>
                      <div className={`text-sm sm:text-base font-bold flex items-center justify-end gap-1 ${
                        isProfit ? 'text-[#D9F99D]' : 'text-red-400'
                      }`}>
                        {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isProfit ? '+' : ''}{pos.currentPnlPercent.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {isProfit ? '+' : ''}${pos.currentPnlUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </div>

                  {/* Take Profit Target Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        Take Profit Target:
                      </span>
                      <span className="text-[#D9F99D] font-bold">
                        +{pos.takeProfitTargetPercent}% ({progressToTp.toFixed(0)}% reached)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D9F99D] transition-all duration-300"
                        style={{ width: `${progressToTp}%` }}
                      />
                    </div>
                  </div>

                  {/* Audit Badges & Safeguard Status */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[9px] uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
                      <ShieldCheck className="w-3 h-3 text-[#D9F99D]" />
                      LP Lock: {pos.token.lpLockedPercent}%
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#0A0A0A] text-zinc-300 border border-white/10">
                      Top 10: {pos.token.top10HolderPercent}%
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#0A0A0A] text-amber-300 border border-amber-500/30">
                      Smart Inflow: {pos.token.smartMoneyScore}/100
                    </span>
                  </div>
                </div>

                {/* Live Position Status & Execution Details */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9F99D] animate-pulse" />
                    <span>{isManual ? 'Manual Order Guarded' : 'Autonomous Order Guarded'}</span>
                  </div>
                  <div className="font-mono text-zinc-500 text-[9px]">
                    Position ID: #{pos.id.slice(-6)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
