import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  AlertTriangle,
  Cpu,
  Sliders,
  Copy,
  Check,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import { MemeToken, EarlyLaunchToken, VaultConfig, GasPriority } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { formatAddressDisplay, getDexScreenerUrl, getExplorerTokenUrl } from '../lib/caParser';
import { formatMarketCap, formatLiquidity, formatTokenPrice } from '../lib/formatters';
import { PriceChangeBadge } from './PriceChangeBadge';

interface SnipeModalProps {
  isOpen: boolean;
  token: MemeToken | EarlyLaunchToken | null;
  onClose: () => void;
  onExecuteSnipe: (token: MemeToken, customAmountUsd: number, isManualBuy?: boolean) => void;
  vaultConfig: VaultConfig;
  cashBalanceUsd: number;
  totalNavUsd: number;
  activePositionsCount?: number;
}

export const SnipeModal: React.FC<SnipeModalProps> = ({
  isOpen,
  token,
  onClose,
  onExecuteSnipe,
  vaultConfig,
  cashBalanceUsd,
  totalNavUsd,
  activePositionsCount = 0,
}) => {
  if (!isOpen || !token) return null;

  const earlyToken = token as EarlyLaunchToken;
  const isExceedingAutoSlots = activePositionsCount >= (vaultConfig.maxActivePositions || 6);

  // Calculate Strategy Default Sizing with $1.00 strict minimum floor
  const calculateStrategyRecommendedAmount = (): number => {
    let size = vaultConfig.allocationPerTradeUsd;
    if (vaultConfig.sizingMode === 'PERCENT_NAV') {
      size = (totalNavUsd * vaultConfig.allocationPercentNav) / 100;
    } else if (vaultConfig.sizingMode === 'SCRUTINY_WEIGHTED') {
      const alphaFactor = Math.max(0.3, Math.min(1.2, token.smartMoneyScore / 80));
      size = vaultConfig.allocationPerTradeUsd * alphaFactor;
    }
    const minFloor = Math.max(1.0, vaultConfig.minTradeSizeUsd || 1.0);
    size = Math.max(minFloor, Math.min(vaultConfig.maxTradeSizeUsd, size));
    return Math.max(1.0, Math.min(size, cashBalanceUsd));
  };

  const recommendedAmount = Math.max(1, Math.round(calculateStrategyRecommendedAmount()));
  const [selectedAmount, setSelectedAmount] = useState<number>(
    cashBalanceUsd >= 1 ? Math.min(recommendedAmount, cashBalanceUsd) : 1
  );
  const [customInputStr, setCustomInputStr] = useState<string>(
    (cashBalanceUsd >= 1 ? Math.min(recommendedAmount, cashBalanceUsd) : 1).toString()
  );

  const [slippage, setSlippage] = useState<number>(vaultConfig.slippageTolerancePercent || 8.0);
  const [gasPriority, setGasPriority] = useState<GasPriority>(vaultConfig.gasPriority || 'TURBO');
  const [copiedCa, setCopiedCa] = useState<boolean>(false);

  useEffect(() => {
    const rec = Math.max(1, Math.round(calculateStrategyRecommendedAmount()));
    const initial = cashBalanceUsd >= 1 ? Math.min(rec, cashBalanceUsd) : 1;
    setSelectedAmount(initial);
    setCustomInputStr(initial.toString());
  }, [token, vaultConfig, totalNavUsd, cashBalanceUsd]);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomInputStr(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      setSelectedAmount(num);
    }
  };

  const handleSetAmount = (amount: number) => {
    const minClamped = Math.max(1.0, amount);
    const capped = Math.min(minClamped, cashBalanceUsd);
    setSelectedAmount(capped);
    setCustomInputStr(capped.toString());
  };

  const handlePercentNav = (pct: number) => {
    const calculated = Math.max(1.0, Math.round((totalNavUsd * pct) / 100));
    handleSetAmount(calculated);
  };

  const handleCopyCa = () => {
    navigator.clipboard.writeText(token.contractAddress);
    setCopiedCa(true);
    setTimeout(() => setCopiedCa(false), 1800);
  };

  const tokensReceived = token.currentPrice > 0 ? selectedAmount / token.currentPrice : 0;
  const chainConfig = CHAINS_CONFIG[token.chain];
  const isBelowMin = selectedAmount < 1.0;
  const isAffordable = selectedAmount >= 1.0 && selectedAmount <= cashBalanceUsd;
  const dexScreenerUrl = getDexScreenerUrl(token.chain, token.contractAddress);
  const explorerUrl = getExplorerTokenUrl(token.chain, token.contractAddress);

  // Determine native DEX router info
  const routerTargetName = earlyToken.launchSource 
    ? `${earlyToken.launchSource} Direct Router`
    : chainConfig.dex;

  const handleConfirm = () => {
    if (!isAffordable) return;
    onExecuteSnipe(token, selectedAmount, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D] shrink-0">
              <Zap className="w-5 h-5 text-[#D9F99D] fill-[#D9F99D]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  INSTANT MEMECOIN SNIPER ROUTER
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PRODUCTION MAINNET
                </span>
                {isExceedingAutoSlots && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    MANUAL BUY (SLOT #{activePositionsCount + 1})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Target: <strong className="text-white">{token.symbol}</strong> ({token.name}) • {chainConfig.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token CA & Safety Bar */}
        <div className="my-3.5 p-3 rounded-lg bg-[#050505] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base">{token.symbol}</span>
              <span className="text-xs text-zinc-400">
                {formatTokenPrice(token.currentPrice)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs flex-wrap justify-end">
              <PriceChangeBadge change24h={token.change24h} size="sm" />
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 font-semibold">MC: {formatMarketCap(token.mcap)}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">LP: {formatLiquidity(token.liquidityUsd)}</span>
            </div>
          </div>

          {/* Explicit Verified CA with 1-Click Copy and DexScreener Link */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400 bg-[#0A0A0A] p-2 rounded-md border border-white/5 font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-zinc-500 font-bold">CA:</span>
              <span className="text-zinc-300 truncate font-semibold" title={token.contractAddress}>
                {formatAddressDisplay(token.contractAddress, 8, 6)}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyCa}
                className="px-2 py-1 min-h-[30px] rounded bg-zinc-900 border border-white/10 hover:border-[#D9F99D]/40 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-[10px] cursor-pointer"
              >
                {copiedCa ? (
                  <>
                    <Check className="w-3 h-3 text-[#D9F99D]" />
                    <span className="text-[#D9F99D] font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <a
                href={dexScreenerUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 min-h-[30px] min-w-[30px] flex items-center justify-center rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-[#D9F99D] hover:bg-zinc-800 transition-colors"
                title="View on DexScreener"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </a>

              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 min-h-[30px] min-w-[30px] flex items-center justify-center rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="View on Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5 text-[9px] uppercase">
            <div className="p-1.5 bg-[#0A0A0A] rounded text-center border border-white/5">
              <span className="text-zinc-500 block">LP LOCK</span>
              <span className="text-[#D9F99D] font-bold">{token.lpLockedPercent}%</span>
            </div>
            <div className="p-1.5 bg-[#0A0A0A] rounded text-center border border-white/5">
              <span className="text-zinc-500 block">TOP 10</span>
              <span className="text-white font-bold">{token.top10HolderPercent}%</span>
            </div>
            <div className="p-1.5 bg-[#0A0A0A] rounded text-center border border-white/5">
              <span className="text-zinc-500 block">DEV SHARE</span>
              <span className="text-white font-bold">{token.devHoldingsPercent}%</span>
            </div>
            <div className="p-1.5 bg-[#0A0A0A] rounded text-center border border-white/5">
              <span className="text-zinc-500 block">TAX SAFE</span>
              <span className="text-emerald-400 font-bold">{earlyToken.taxBuySell || '0% / 0%'}</span>
            </div>
          </div>
        </div>

        {/* Position Sizing Selector */}
        <div className="space-y-2.5 my-3">
          <div className="flex items-center justify-between text-xs">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span>SNIPE ALLOCATION (USD)</span>
              <span className="px-1.5 py-0.5 rounded bg-[#D9F99D]/15 text-[#D9F99D] font-mono text-[9px]">
                $1.00 MIN
              </span>
            </label>
            <span className="text-zinc-400 text-[11px]">
              Cash Available: <strong className="text-white">${cashBalanceUsd.toFixed(2)}</strong>
            </span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 50, 100, 250].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSetAmount(amt)}
                className={`py-2 min-h-[44px] rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  selectedAmount === amt
                    ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D]'
                    : 'border-white/10 bg-[#050505] text-zinc-400 hover:text-white'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Percentage Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handlePercentNav(2)}
              className="py-1.5 min-h-[44px] rounded-md text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D] cursor-pointer"
            >
              2% NAV
            </button>
            <button
              type="button"
              onClick={() => handlePercentNav(5)}
              className="py-1.5 min-h-[44px] rounded-md text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D] cursor-pointer"
            >
              5% NAV
            </button>
            <button
              type="button"
              onClick={() => handlePercentNav(10)}
              className="py-1.5 min-h-[44px] rounded-md text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D] cursor-pointer"
            >
              10% NAV
            </button>
            <button
              type="button"
              onClick={() => handleSetAmount(cashBalanceUsd)}
              className="py-1.5 min-h-[44px] rounded-md text-[10px] uppercase font-bold border border-[#D9F99D]/30 bg-[#050505] text-[#D9F99D] hover:bg-[#D9F99D]/10 cursor-pointer"
            >
              MAX
            </button>
          </div>

          {/* Amount Number Input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
              $
            </span>
            <input
              type="number"
              min="1"
              max={cashBalanceUsd}
              step="any"
              value={customInputStr}
              onChange={handleCustomChange}
              placeholder="1.00"
              className="w-full bg-[#050505] border border-white/10 rounded-lg pl-8 pr-3 py-2.5 min-h-[44px] text-sm text-white focus:outline-none focus:border-[#D9F99D]/60 font-mono font-bold"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500">
            <span>Minimum trade execution is $1.00 USD</span>
            <span>Floor: $1.00 Min</span>
          </div>
        </div>

        {/* Memecoin Launch Execution Parameters: Slippage & Priority Gas */}
        <div className="p-3 rounded-lg bg-[#050505] border border-white/10 my-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-[#D9F99D]" />
              LAUNCH SLIPPAGE TOLERANCE
            </span>
            <span className="text-xs text-[#D9F99D] font-bold">{slippage}% Max</span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-xs">
            {[3, 5, 8, 12, 20].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlippage(s)}
                className={`py-2 min-h-[44px] rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                  slippage === s
                    ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D]'
                    : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>

          {/* Priority Gas / MEV Protection */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#D9F99D]" />
                COMPUTE UNIT & MEV TIP LEVEL
              </span>
              <span className="text-[10px] text-zinc-400">
                {token.chain === 'solana' ? '+0.002 SOL Jito Bundle' : 'Turbo Gas Priority'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {(['NORMAL', 'FAST', 'TURBO', 'ULTRA'] as GasPriority[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setGasPriority(level)}
                  className={`py-2 min-h-[44px] rounded text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                    gasPriority === level
                      ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                      : 'border-white/5 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Preview */}
        <div className="mt-3 p-3 rounded-lg bg-[#050505] border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Estimated Tokens:</span>
            <strong className="text-white">
              {tokensReceived.toLocaleString('en-US', { maximumFractionDigits: 2 })} {token.symbol}
            </strong>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Target Router:</span>
            <span className="text-[#D9F99D] font-bold">{routerTargetName}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Take-Profit Target:</span>
            <span className="text-emerald-400 font-bold">+{vaultConfig.takeProfitPercent}%</span>
          </div>
        </div>

        {isBelowMin && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Minimum vault execution is $1.00. Please enter at least $1.00 USD.</span>
          </div>
        )}

        {selectedAmount > cashBalanceUsd && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>Amount exceeds available vault cash (${cashBalanceUsd.toFixed(2)}).</span>
          </div>
        )}

        {/* Execute Snipe Action Buttons */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 bg-[#050505] border border-white/10 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-snipe-modal"
            type="button"
            onClick={handleConfirm}
            disabled={!isAffordable}
            className="flex-[2] py-2.5 min-h-[44px] rounded-lg text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#D9F99D]/20 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>SNIPE ${selectedAmount} ({token.symbol})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
