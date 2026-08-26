import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Sparkles, 
  DollarSign, 
  Percent, 
  Lock,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { MemeToken, VaultConfig, Chain } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';

interface SnipeModalProps {
  isOpen: boolean;
  token: MemeToken | null;
  onClose: () => void;
  onExecuteSnipe: (token: MemeToken, customAmountUsd: number) => void;
  vaultConfig: VaultConfig;
  cashBalanceUsd: number;
  totalNavUsd: number;
}

export const SnipeModal: React.FC<SnipeModalProps> = ({
  isOpen,
  token,
  onClose,
  onExecuteSnipe,
  vaultConfig,
  cashBalanceUsd,
  totalNavUsd,
}) => {
  if (!isOpen || !token) return null;

  // Calculate Strategy Default Sizing
  const calculateStrategyRecommendedAmount = (): number => {
    let size = vaultConfig.allocationPerTradeUsd;
    if (vaultConfig.sizingMode === 'PERCENT_NAV') {
      size = (totalNavUsd * vaultConfig.allocationPercentNav) / 100;
    } else if (vaultConfig.sizingMode === 'SCRUTINY_WEIGHTED') {
      // Scale from 30% to 120% of base allocation depending on alpha score
      const alphaFactor = Math.max(0.3, Math.min(1.2, token.smartMoneyScore / 80));
      size = vaultConfig.allocationPerTradeUsd * alphaFactor;
    }
    // Respect safeguard caps
    size = Math.max(vaultConfig.minTradeSizeUsd, Math.min(vaultConfig.maxTradeSizeUsd, size));
    // Cannot exceed available cash
    return Math.min(size, cashBalanceUsd);
  };

  const recommendedAmount = Math.round(calculateStrategyRecommendedAmount());
  const [selectedAmount, setSelectedAmount] = useState<number>(recommendedAmount > 0 ? recommendedAmount : 100);
  const [customInputStr, setCustomInputStr] = useState<string>(
    (recommendedAmount > 0 ? recommendedAmount : 100).toString()
  );

  useEffect(() => {
    const rec = Math.round(calculateStrategyRecommendedAmount());
    const initial = rec > 0 ? rec : Math.min(100, cashBalanceUsd);
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
    const capped = Math.min(amount, cashBalanceUsd);
    setSelectedAmount(capped);
    setCustomInputStr(capped.toString());
  };

  const handlePercentNav = (pct: number) => {
    const calculated = Math.round((totalNavUsd * pct) / 100);
    handleSetAmount(calculated);
  };

  const handlePercentCash = (pct: number) => {
    const calculated = Math.round((cashBalanceUsd * pct) / 100);
    handleSetAmount(calculated);
  };

  const tokensReceived = token.currentPrice > 0 ? selectedAmount / token.currentPrice : 0;
  const chainConfig = CHAINS_CONFIG[token.chain];
  const isAffordable = selectedAmount > 0 && selectedAmount <= cashBalanceUsd;

  const handleConfirm = () => {
    if (!isAffordable) return;
    onExecuteSnipe(token, selectedAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
              <Zap className="w-5 h-5 text-[#D9F99D] fill-[#D9F99D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Execute Algorithmic Snipe
                </h2>
                <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
                  {vaultConfig.tradingMode === 'LIVE_MAINNET' ? 'LIVE MAINNET' : 'SIMULATION'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Target: <strong className="text-white">{token.symbol}</strong> ({token.name}) on {chainConfig.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Scrutiny Summary */}
        <div className="my-4 p-3 rounded-lg bg-[#050505] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{token.symbol}</span>
              <span className="text-xs text-zinc-400">
                ${token.currentPrice < 0.01 ? token.currentPrice.toFixed(6) : token.currentPrice.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-emerald-400 font-bold">+{token.change24h}% 24h</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">MCap: ${(token.mcap / 1000).toFixed(0)}k</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px] uppercase">
            <div className="p-1.5 bg-[#0A0A0A] rounded-sm text-center">
              <span className="opacity-40 block">LP LOCKED</span>
              <span className="text-[#D9F99D] font-bold">{token.lpLockedPercent}%</span>
            </div>
            <div className="p-1.5 bg-[#0A0A0A] rounded-sm text-center">
              <span className="opacity-40 block">TOP 10 HOLD</span>
              <span className="text-white font-bold">{token.top10HolderPercent}%</span>
            </div>
            <div className="p-1.5 bg-[#0A0A0A] rounded-sm text-center">
              <span className="opacity-40 block">RUG RISK</span>
              <span className="text-[#D9F99D] font-bold">{token.rugRiskScore}/100</span>
            </div>
          </div>
        </div>

        {/* Strategy Recommendation Banner */}
        <div className="p-3 rounded-md bg-[#D9F99D]/10 border border-[#D9F99D]/30 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9F99D]" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Strategy Recommendation ({vaultConfig.sizingMode.replace('_', ' ')})
              </div>
              <div className="text-[10px] text-zinc-400">
                Optimal risk-adjusted capital: <strong className="text-[#D9F99D]">${recommendedAmount} USD</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSetAmount(recommendedAmount)}
            className="px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#D9F99D] text-black hover:bg-[#bef264]"
          >
            Apply Rec
          </button>
        </div>

        {/* Custom Position Sizing Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="text-[10px] uppercase tracking-widest text-zinc-400">
              CUSTOM TRADE AMOUNT (USD)
            </label>
            <span className="text-zinc-400 text-[11px]">
              Available Cash: <strong className="text-white">${cashBalanceUsd.toFixed(2)}</strong>
            </span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSetAmount(amt)}
                className={`py-1.5 rounded-sm text-xs font-bold border transition-colors ${
                  selectedAmount === amt
                    ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D]'
                    : 'border-white/10 bg-[#050505] text-zinc-400 hover:text-white'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Dynamic Percentage of Vault NAV / Cash */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handlePercentNav(2)}
              className="py-1.5 rounded-sm text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D]"
            >
              2% NAV
            </button>
            <button
              type="button"
              onClick={() => handlePercentNav(5)}
              className="py-1.5 rounded-sm text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D]"
            >
              5% NAV
            </button>
            <button
              type="button"
              onClick={() => handlePercentNav(10)}
              className="py-1.5 rounded-sm text-[10px] uppercase font-bold border border-white/10 bg-[#050505] text-zinc-400 hover:text-[#D9F99D]"
            >
              10% NAV
            </button>
            <button
              type="button"
              onClick={() => handlePercentCash(100)}
              className="py-1.5 rounded-sm text-[10px] uppercase font-bold border border-[#D9F99D]/30 bg-[#050505] text-[#D9F99D] hover:bg-[#D9F99D]/10"
            >
              Max Cash
            </button>
          </div>

          {/* Amount Number Input */}
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              $
            </span>
            <input
              type="number"
              min="1"
              max={cashBalanceUsd}
              step="1"
              value={customInputStr}
              onChange={handleCustomChange}
              placeholder="100"
              className="w-full bg-[#050505] border border-white/10 rounded-md pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D9F99D]/60"
            />
          </div>

          {/* Slider */}
          <div className="pt-1">
            <input
              type="range"
              min="10"
              max={Math.max(100, Math.min(2000, cashBalanceUsd))}
              step="10"
              value={selectedAmount}
              onChange={(e) => handleSetAmount(Number(e.target.value))}
              className="w-full accent-[#D9F99D] cursor-pointer"
            />
          </div>
        </div>

        {/* Execution Preview */}
        <div className="mt-4 p-3 rounded-lg bg-[#050505] border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Estimated Tokens:</span>
            <strong className="text-white">
              {tokensReceived.toLocaleString('en-US', { maximumFractionDigits: 2 })} {token.symbol}
            </strong>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Routing DEX:</span>
            <span className="text-[#D9F99D] font-bold">{chainConfig.dex}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Slippage & MEV Shield:</span>
            <span className="text-[#D9F99D]">
              {vaultConfig.slippageTolerancePercent}% • {vaultConfig.jitoMevProtection ? 'Jito Bundle Active' : 'Standard'}
            </span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span className="text-zinc-500">Auto Take-Profit Limit:</span>
            <span className="text-amber-400 font-bold">+{vaultConfig.takeProfitPercent}%</span>
          </div>
        </div>

        {selectedAmount > cashBalanceUsd && (
          <div className="mt-3 p-2.5 rounded-md bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Amount exceeds available vault cash reserve (${cashBalanceUsd.toFixed(2)}).</span>
          </div>
        )}

        {/* Execute Snipe Action */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider text-zinc-400 bg-[#050505] border border-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-snipe-modal"
            type="button"
            onClick={handleConfirm}
            disabled={!isAffordable}
            className="flex-[2] py-2.5 rounded-sm text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>Snipe ${selectedAmount} USD ({token.symbol})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
