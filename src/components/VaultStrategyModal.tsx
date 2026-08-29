import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  ShieldCheck, 
  Flame, 
  Save,
  DollarSign,
  Percent,
  Sparkles,
  Zap,
  Lock,
  Radio,
  Activity
} from 'lucide-react';
import { VaultConfig, Chain, SizingMode, TradingMode, GasPriority } from '../types';

interface VaultStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VaultConfig;
  onSaveConfig: (newConfig: VaultConfig) => void;
  totalNavUsd?: number;
  initialTab?: 'sizing' | 'execution' | 'scrutiny';
}

export const VaultStrategyModal: React.FC<VaultStrategyModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  totalNavUsd = 10000,
  initialTab = 'sizing',
}) => {
  const [formData, setFormData] = useState<VaultConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'sizing' | 'execution' | 'scrutiny'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...config });
      setActiveTab(initialTab);
    }
  }, [isOpen, config, initialTab]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: 'conservative' | 'balanced' | 'degen' | 'pro_live') => {
    if (preset === 'conservative') {
      setFormData({
        ...formData,
        riskProfile: 'conservative',
        sizingMode: 'FIXED_USD',
        takeProfitPercent: 45,
        stopLossPercent: 15,
        allocationPerTradeUsd: 50,
        allocationPercentNav: 2,
        minTradeSizeUsd: 25,
        maxTradeSizeUsd: 200,
        minLpLockedPercent: 95,
        maxTop10Concentration: 10,
        rugShieldSensitivity: 'INSTANT_DODGE',
        slippageTolerancePercent: 0.5,
        jitoMevProtection: true,
        gasPriority: 'NORMAL',
      });
    } else if (preset === 'balanced') {
      setFormData({
        ...formData,
        riskProfile: 'balanced',
        sizingMode: 'PERCENT_NAV',
        allocationPercentNav: 5,
        allocationPerTradeUsd: 100,
        minTradeSizeUsd: 50,
        maxTradeSizeUsd: 500,
        takeProfitPercent: 80,
        stopLossPercent: 20,
        minLpLockedPercent: 90,
        maxTop10Concentration: 15,
        rugShieldSensitivity: 'HIGH',
        slippageTolerancePercent: 1.0,
        jitoMevProtection: true,
        gasPriority: 'FAST',
      });
    } else if (preset === 'pro_live') {
      setFormData({
        ...formData,
        riskProfile: 'balanced',
        tradingMode: 'LIVE_MAINNET',
        sizingMode: 'SCRUTINY_WEIGHTED',
        allocationPerTradeUsd: 250,
        allocationPercentNav: 7.5,
        minTradeSizeUsd: 50,
        maxTradeSizeUsd: 1000,
        takeProfitPercent: 100,
        stopLossPercent: 18,
        minLpLockedPercent: 95,
        maxTop10Concentration: 12,
        rugShieldSensitivity: 'INSTANT_DODGE',
        slippageTolerancePercent: 1.0,
        jitoMevProtection: true,
        jitoTipSol: 0.002,
        gasPriority: 'TURBO',
        autoSignDelegatedKey: true,
      });
    } else {
      setFormData({
        ...formData,
        riskProfile: 'degen',
        sizingMode: 'FIXED_USD',
        takeProfitPercent: 200,
        stopLossPercent: 30,
        allocationPerTradeUsd: 300,
        allocationPercentNav: 12,
        minTradeSizeUsd: 100,
        maxTradeSizeUsd: 2000,
        minLpLockedPercent: 80,
        maxTop10Concentration: 25,
        rugShieldSensitivity: 'MAX_SAFEGUARD',
        slippageTolerancePercent: 3.0,
        jitoMevProtection: false,
        gasPriority: 'ULTRA',
      });
    }
  };

  const handleChainToggle = (chain: Chain) => {
    const currentAllowed = formData.allowedChains || { solana: true, bnb: true, robinhood: true };
    setFormData({
      ...formData,
      allowedChains: {
        ...currentAllowed,
        [chain]: !currentAllowed[chain],
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...formData,
      minTradeSizeUsd: Math.max(1, Number(formData.minTradeSizeUsd) || 1),
      allocationPerTradeUsd: Math.max(1, Number(formData.allocationPerTradeUsd) || 1),
    });
    onClose();
  };

  // Preview calculated sizing for percent NAV mode ($1.00 floor applied)
  const rawNavSizingDollars = (totalNavUsd * formData.allocationPercentNav) / 100;
  const currentNavSizingDollars = Math.max(1, Math.round(rawNavSizingDollars));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-xl bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-6 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
              <Sliders className="w-4 h-4 text-[#D9F99D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Autonomous Strategy & Position Sizing Engine
                </h2>
                <span className="px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PRODUCTION MAINNET
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Calibrate dynamic capital allocation per coin, MEV defenses, and take-profit limits.
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

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 my-4 bg-[#050505] p-1 rounded-md border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sizing')}
            className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'sizing'
                ? 'bg-[#D9F99D] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Position Sizing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('execution')}
            className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'execution'
                ? 'bg-[#D9F99D] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live MEV & Routing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scrutiny')}
            className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'scrutiny'
                ? 'bg-[#D9F99D] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Scrutiny & Exits
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
          {/* TAB 1: POSITION SIZING CUSTOMIZATION */}
          {activeTab === 'sizing' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  STRATEGY PRESETS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('conservative')}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      formData.riskProfile === 'conservative'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D]'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">Conservative</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">$50 / trade</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('balanced')}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      formData.riskProfile === 'balanced' && formData.sizingMode === 'PERCENT_NAV'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D]'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-[#D9F99D] uppercase">Balanced %</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">5% of NAV</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('pro_live')}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      formData.sizingMode === 'SCRUTINY_WEIGHTED'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D]'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-amber-300 uppercase">Alpha Sizing</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">Risk-Weighted</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetSelect('degen')}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      formData.riskProfile === 'degen'
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">Degen Moon</div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">$300+ / trade</div>
                  </button>
                </div>
              </div>

              {/* Sizing Mode Selection */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-3">
                <label className="block text-[10px] uppercase tracking-widest text-[#D9F99D] font-bold">
                  CAPITAL ALLOCATION STRATEGY PER COIN
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizingMode: 'FIXED_USD' })}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      formData.sizingMode === 'FIXED_USD'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Fixed USD</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1">
                      Static dollar amount per meme pool
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizingMode: 'PERCENT_NAV' })}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      formData.sizingMode === 'PERCENT_NAV'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      <Percent className="w-3.5 h-3.5" />
                      <span>% of Total NAV</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1">
                      Scales dynamically with portfolio equity
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizingMode: 'SCRUTINY_WEIGHTED' })}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      formData.sizingMode === 'SCRUTINY_WEIGHTED'
                        ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Alpha Weighted</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1">
                      Scales with Rawsight Scrutiny score
                    </div>
                  </button>
                </div>

                {/* Sizing Controls depending on selected mode */}
                {formData.sizingMode === 'FIXED_USD' && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 text-[10px] uppercase">Fixed USD Amount Per Coin ($1.00 Min):</span>
                      <strong className="text-[#D9F99D]">${formData.allocationPerTradeUsd} USD</strong>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 50, 100, 250].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFormData({ ...formData, allocationPerTradeUsd: amt })}
                          className={`py-1.5 rounded-sm text-xs font-bold border transition-colors ${
                            formData.allocationPerTradeUsd === amt
                              ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                              : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-500">Custom $:</span>
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        step="1"
                        value={formData.allocationPerTradeUsd}
                        onChange={(e) => setFormData({ ...formData, allocationPerTradeUsd: Math.max(1, Number(e.target.value)) })}
                        className="bg-[#0A0A0A] border border-white/10 rounded-sm px-2.5 py-1 text-xs text-white flex-1 focus:outline-none focus:border-[#D9F99D]/50"
                      />
                    </div>
                  </div>
                )}

                {formData.sizingMode === 'PERCENT_NAV' && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 text-[10px] uppercase">Portfolio Allocation %:</span>
                      <strong className="text-[#D9F99D]">
                        {formData.allocationPercentNav}% (≈ ${currentNavSizingDollars} USD • $1.00 Min Floor)
                      </strong>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3.5, 5, 10].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setFormData({ ...formData, allocationPercentNav: pct })}
                          className={`py-1.5 rounded-sm text-xs font-bold border transition-colors ${
                            formData.allocationPercentNav === pct
                              ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                              : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="20"
                      step="0.1"
                      value={formData.allocationPercentNav}
                      onChange={(e) => setFormData({ ...formData, allocationPercentNav: Number(e.target.value) })}
                      className="w-full accent-[#D9F99D] cursor-pointer mt-1"
                    />
                    <div className="text-[10px] text-zinc-500">
                      Calculated allocations below $1.00 automatically floor to $1.00 minimum if funds allow.
                    </div>
                  </div>
                )}

                {formData.sizingMode === 'SCRUTINY_WEIGHTED' && (
                  <div className="pt-2 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[10px] uppercase">Base Allocation ($1.00 Min):</span>
                      <strong className="text-[#D9F99D]">${formData.allocationPerTradeUsd} USD</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] p-2 rounded bg-[#0A0A0A] border border-white/5">
                      <div>
                        <span className="text-[#D9F99D] block font-bold">Alpha 95-100</span>
                        <span className="text-zinc-400">120% (${Math.max(1, Math.round(formData.allocationPerTradeUsd * 1.2))})</span>
                      </div>
                      <div>
                        <span className="text-white block font-bold">Alpha 85-94</span>
                        <span className="text-zinc-400">100% (${Math.max(1, formData.allocationPerTradeUsd)})</span>
                      </div>
                      <div>
                        <span className="text-amber-400 block font-bold">Alpha 75-84</span>
                        <span className="text-zinc-400">60% (${Math.max(1, Math.round(formData.allocationPerTradeUsd * 0.6))})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Safeguard Caps */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-400">
                    POSITION SIZE SAFEGUARD CAPS (USD)
                  </span>
                  <span className="text-[10px] text-[#D9F99D] font-bold">
                    $1.00 Min Floor Guard
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Min Size Floor ($1.00 Min)</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="1"
                      value={formData.minTradeSizeUsd}
                      onChange={(e) => setFormData({ ...formData, minTradeSizeUsd: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-2 py-1 text-white mt-1 text-xs focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Strict $1.00 minimum execution limit</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Max Exposure Ceiling</span>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="10"
                      value={formData.maxTradeSizeUsd}
                      onChange={(e) => setFormData({ ...formData, maxTradeSizeUsd: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-2 py-1 text-white mt-1 text-xs focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Cap per individual position</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MEV & EXECUTION */}
          {activeTab === 'execution' && (
            <div className="space-y-4">
              {/* Production Mainnet Status Banner */}
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      PRODUCTION MAINNET ENGINE ARMED
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    REAL ON-CHAIN SWAPS
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Trades are executed with zero simulation delay using Jupiter DEX on Solana, PancakeSwap on BSC, and Uniswap on Robinhood Chain.
                </p>
              </div>

              {/* Chain Isolation Rule Explanation */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-2.5">
                <label className="block text-[10px] uppercase tracking-widest text-[#D9F99D] font-bold">
                  CHAIN-ISOLATED EXECUTION RULES
                </label>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2 p-2 rounded bg-zinc-950 border border-white/5">
                    <span className="text-[#D9F99D] font-bold shrink-0">SOL:</span>
                    <span className="text-zinc-300 text-[11px]">
                      When a Solana token is detected, buys and sells execute <strong>only</strong> on Solana with SOL via connected Solana wallet (Jupiter/Raydium).
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-zinc-950 border border-white/5">
                    <span className="text-amber-400 font-bold shrink-0">BNB:</span>
                    <span className="text-zinc-300 text-[11px]">
                      When a BNB token is detected, buys and sells execute <strong>only</strong> on BNB Chain with BNB via connected EVM wallet (PancakeSwap).
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-zinc-950 border border-white/5">
                    <span className="text-cyan-400 font-bold shrink-0">RH:</span>
                    <span className="text-zinc-300 text-[11px]">
                      When a Robinhood token is detected, buys and sells execute <strong>only</strong> on Robinhood Chain with ETH via connected EVM wallet (Uniswap).
                    </span>
                  </div>
                </div>
              </div>

              {/* Slippage & MEV Tip */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase tracking-widest text-[#D9F99D] font-bold">
                    SLIPPAGE TOLERANCE LIMIT
                  </span>
                  <span className="text-white font-bold">{formData.slippageTolerancePercent}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1.0, 2.5, 5.0].map((slip) => (
                    <button
                      key={slip}
                      type="button"
                      onClick={() => setFormData({ ...formData, slippageTolerancePercent: slip })}
                      className={`py-1.5 rounded-sm text-xs font-bold border transition-colors ${
                        formData.slippageTolerancePercent === slip
                          ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                          : 'border-white/10 bg-[#0A0A0A] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {slip}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Jito MEV Anti-Sandwich Protection */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#D9F99D]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Jito Private Validator Bundles
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, jitoMevProtection: !formData.jitoMevProtection })}
                    className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${
                      formData.jitoMevProtection ? 'bg-[#D9F99D] text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {formData.jitoMevProtection ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Protects live swaps from predatory front-running and sandwich MEV bots on Solana Raydium.
                </p>
              </div>

              {/* Multi-Chain Execution Toggles */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400">
                  SUPPORTED TRADING NETWORKS
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChainToggle('solana')}
                    className={`p-2.5 rounded-sm border text-center text-xs transition-all ${
                      formData.allowedChains?.solana
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-zinc-900/50 text-zinc-500 line-through'
                    }`}
                  >
                    Solana
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChainToggle('bnb')}
                    className={`p-2.5 rounded-sm border text-center text-xs transition-all ${
                      formData.allowedChains?.bnb
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                        : 'border-white/10 bg-zinc-900/50 text-zinc-500 line-through'
                    }`}
                  >
                    BNB Chain
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChainToggle('robinhood')}
                    className={`p-2.5 rounded-sm border text-center text-xs transition-all ${
                      formData.allowedChains?.robinhood
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-zinc-900/50 text-zinc-500 line-through'
                    }`}
                  >
                    Robinhood L2
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCRUTINY & EXITS */}
          {activeTab === 'scrutiny' && (
            <div className="space-y-4">
              {/* Target Take-Profit and Stop Loss */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#050505] border border-white/10">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#D9F99D] font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Take Profit Limit:
                    </span>
                    <span className="text-xs font-bold text-white">
                      +{formData.takeProfitPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="5"
                    value={formData.takeProfitPercent}
                    onChange={(e) => setFormData({ ...formData, takeProfitPercent: Number(e.target.value) })}
                    className="w-full accent-[#D9F99D] cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Liquidates 100% position immediately once profit crosses this threshold.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-red-400 font-bold">
                      Stop Loss Safeguard:
                    </span>
                    <span className="text-xs font-bold text-white">
                      -{formData.stopLossPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={formData.stopLossPercent}
                    onChange={(e) => setFormData({ ...formData, stopLossPercent: Number(e.target.value) })}
                    className="w-full accent-red-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Hard stop loss to prevent cascading drawdowns.
                  </p>
                </div>
              </div>

              {/* Rawsight Bot Scrutiny Thresholds */}
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-[#D9F99D] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#D9F99D]" />
                  <span className="uppercase tracking-wider">RAWSIGHT SCRUTINY RIGOR</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-widest">Min LP Locked %</span>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={formData.minLpLockedPercent}
                      onChange={(e) => setFormData({ ...formData, minLpLockedPercent: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-2 py-1 text-white mt-1 text-xs focus:outline-none focus:border-[#D9F99D]/50"
                    />
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase tracking-widest">Max Top 10 Concentration %</span>
                    <input
                      type="number"
                      min="5"
                      max="40"
                      value={formData.maxTop10Concentration}
                      onChange={(e) => setFormData({ ...formData, maxTop10Concentration: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm px-2 py-1 text-white mt-1 text-xs focus:outline-none focus:border-[#D9F99D]/50"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-white/5">
                  <span>Rug Defense Sensitivity:</span>
                  <span className="text-amber-300 font-bold">{formData.rugShieldSensitivity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="btn-save-strategy"
              type="submit"
              className="w-full py-2.5 rounded-sm text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4 text-black" />
              <span>Apply Sizing & Strategy to Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

