import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Wallet, 
  Layers, 
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Key
} from 'lucide-react';
import { VaultState, VaultConfig } from '../types';
import { KeyViewer } from './KeyViewer';

interface VaultOverviewProps {
  vaultState: VaultState;
  vaultConfig: VaultConfig;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onEmergencyCloseAll: () => void;
  onOpenStrategy: () => void;
  activePositionsCount: number;
}

export const VaultOverview: React.FC<VaultOverviewProps> = ({
  vaultState,
  vaultConfig,
  onOpenDeposit,
  onOpenWithdraw,
  onEmergencyCloseAll,
  onOpenStrategy,
  activePositionsCount,
}) => {
  const [showKeyViewer, setShowKeyViewer] = useState(false);

  const winRate = vaultState.totalTrades > 0 
    ? Math.round((vaultState.winningTrades / vaultState.totalTrades) * 100) 
    : 100;

  const totalReturnPercent = vaultState.cashBalanceUsd + vaultState.allocatedInPositionsUsd > 0
    ? ((vaultState.realizedPnlUsd + vaultState.unrealizedPnlUsd) / 
       Math.max(1, vaultState.totalNavUsd - (vaultState.realizedPnlUsd + vaultState.unrealizedPnlUsd))) * 100
    : 0;

  return (
    <section className="w-full mb-6 font-mono space-y-4">
      {/* Bento Grid Header & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D9F99D]/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[#D9F99D] font-bold">
              Rawsight Multi-Chain Vault Core
            </span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span className="text-[11px] opacity-60 uppercase tracking-wider hidden sm:inline">
              Solana • BNB Chain • Robinhood Chain
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Algorithmic High-Velocity Multi-Chain Liquidity Engine
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-overview-keys"
            onClick={() => setShowKeyViewer(!showKeyViewer)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showKeyViewer
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white hover:border-amber-400/40'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{showKeyViewer ? 'Hide Vault Keys' : 'Vault Keys'}</span>
          </button>

          <button
            id="btn-overview-deposit"
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-black" />
            <span>Deposit Funds</span>
          </button>

          <button
            id="btn-overview-withdraw"
            onClick={onOpenWithdraw}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider text-[#D9F99D] bg-[#0A0A0A] border border-[#D9F99D]/30 hover:bg-[#D9F99D]/10 active:scale-95 transition-all cursor-pointer"
          >
            <span>Withdraw</span>
          </button>

          {activePositionsCount > 0 && (
            <button
              id="btn-emergency-panic"
              onClick={onEmergencyCloseAll}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider border border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 hover:border-red-500 active:scale-95 transition-all cursor-pointer"
              title="Emergency close all active positions immediately"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Panic Close All ({activePositionsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Persistent Operational Key Viewer (when toggled) */}
      {showKeyViewer && (
        <div className="animate-in fade-in duration-200">
          <KeyViewer />
        </div>
      )}

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Cell 1: Hero Total Vault Equity (Span 8) */}
        <div className="md:col-span-8 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#D9F99D]/50 transition-all">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="text-xs opacity-60 mb-1 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#D9F99D]" />
                Total Vault Equity (NAV)
              </div>
              <div className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white">
                ${vaultState.totalNavUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
              vaultConfig.tradingMode === 'LIVE_MAINNET'
                ? 'bg-red-500/15 text-red-300 border border-red-500/40'
                : 'bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/40'
            }`}>
              {vaultConfig.tradingMode === 'LIVE_MAINNET' ? '● LIVE MAINNET' : 'SIMULATION_SANDBOX'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mt-6 pt-4 border-t border-white/5">
            <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-4 w-full sm:w-auto">
              <div>
                <div className="text-[10px] opacity-40 uppercase tracking-wider mb-0.5">Realized Profit</div>
                <div className={`text-lg sm:text-2xl font-bold tracking-tight ${
                  vaultState.realizedPnlUsd >= 0 ? 'text-[#D9F99D]' : 'text-red-400'
                }`}>
                  {vaultState.realizedPnlUsd >= 0 ? '+' : ''}${vaultState.realizedPnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(1)}% all-time
                </div>
              </div>

              <div>
                <div className="text-[10px] opacity-40 uppercase tracking-wider mb-0.5">Active In-Play</div>
                <div className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {activePositionsCount} Positions
                </div>
                <div className="text-[10px] text-[#D9F99D]/80">
                  ${vaultState.allocatedInPositionsUsd.toFixed(2)} deployed
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] opacity-40 uppercase tracking-wider mb-0.5">Cash Reserve</div>
                <div className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                  ${vaultState.cashBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Available for snipes
                </div>
              </div>
            </div>

            {/* Geometric Bar Chart Sparkline */}
            <div className="hidden sm:flex gap-1.5 items-end h-16 shrink-0 self-end">
              <div className="w-3.5 bg-[#D9F99D]/20 h-[35%] rounded-t-sm" title="T-4" />
              <div className="w-3.5 bg-[#D9F99D]/40 h-[55%] rounded-t-sm" title="T-3" />
              <div className="w-3.5 bg-[#D9F99D]/60 h-[45%] rounded-t-sm" title="T-2" />
              <div className="w-3.5 bg-[#D9F99D]/80 h-[80%] rounded-t-sm" title="T-1" />
              <div className="w-3.5 bg-[#D9F99D] h-[100%] rounded-t-sm" title="Now" />
            </div>
          </div>
        </div>

        {/* Bento Cell 2: Inverted Accent Card (Rawsight Engine Active) (Span 4) */}
        <div className="md:col-span-4 bg-[#D9F99D] text-black rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="font-black text-xs uppercase tracking-widest">Rawsight Engine</span>
            <span className="text-[10px] font-bold bg-black/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {vaultConfig.autoTradeEnabled ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <div className="my-4">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
              98.4%
            </div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Scrutiny Index
            </div>
          </div>
          <div className="text-[11px] font-medium leading-relaxed opacity-90 border-t border-black/10 pt-3">
            Filtering out fake locks, dev wallet bundles, and insider clusters across 3 chains in real-time.
          </div>
        </div>

        {/* Bento Cell 3: Multi-Chain Allocation (Span 4) */}
        <div className="md:col-span-4 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] opacity-60 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Chain Allocation</span>
              <span className="text-[9px] text-[#D9F99D]">MULTI-ROUTING</span>
            </div>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="opacity-90">Solana (Raydium)</span>
                  <span className="font-bold text-[#D9F99D]">65%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-[#D9F99D]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="opacity-90">BNB Chain (Pancake)</span>
                  <span className="font-bold text-amber-400">20%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[20%] h-full bg-amber-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="opacity-90">Robinhood Chain</span>
                  <span className="font-bold text-[#D9F99D]">15%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[15%] h-full bg-[#D9F99D]" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Dynamic Rebalancing</span>
            <span className="text-[#D9F99D]">ONLINE</span>
          </div>
        </div>

        {/* Bento Cell 4: Shield Defense Engine (Span 4) */}
        <div className="md:col-span-4 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] opacity-60 uppercase tracking-widest mb-2">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                Shield Defense Engine
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {vaultConfig.rugShieldSensitivity}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl lg:text-4xl font-bold text-amber-400 tracking-tight">
                {vaultState.rugsShieldedCount + vaultState.insiderDumpsDodgedCount}
              </span>
              <span className="text-xs text-amber-200/80 uppercase tracking-wider">
                threats neutralized
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span>LP Drains Blocked:</span>
              <strong className="text-amber-300">{vaultState.rugsShieldedCount}</strong>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Insider Dump Clusters Dodged:</span>
              <strong className="text-amber-300">{vaultState.insiderDumpsDodgedCount}</strong>
            </div>
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span>Win Rate:</span>
              <strong className="text-[#D9F99D]">{winRate}% ({vaultState.winningTrades}W / {vaultState.losingTrades}L)</strong>
            </div>
          </div>
        </div>

        {/* Bento Cell 5: Strategy Limits & Tuning (Span 4) */}
        <div className="md:col-span-4 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] opacity-60 uppercase tracking-widest mb-2">
              <span className="flex items-center gap-1.5 text-[#D9F99D] font-bold">
                <Flame className="w-3.5 h-3.5" />
                Sizing & Strategy
              </span>
              <button
                onClick={onOpenStrategy}
                className="text-[10px] uppercase text-[#D9F99D] hover:underline font-bold cursor-pointer"
              >
                Tune Sizing
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl lg:text-4xl font-bold text-[#D9F99D] tracking-tight">
                +{vaultConfig.takeProfitPercent}%
              </span>
              <span className="text-xs text-zinc-400 uppercase">
                TP / -{vaultConfig.stopLossPercent}% SL
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span>Sizing Strategy:</span>
              <strong className="text-white">
                {vaultConfig.sizingMode === 'FIXED_USD' && `$${vaultConfig.allocationPerTradeUsd}/coin`}
                {vaultConfig.sizingMode === 'PERCENT_NAV' && `${vaultConfig.allocationPercentNav}% NAV ($${Math.max(1, Math.round((vaultState.totalNavUsd * vaultConfig.allocationPercentNav) / 100))})`}
                {vaultConfig.sizingMode === 'SCRUTINY_WEIGHTED' && `Alpha-Weighted ($${vaultConfig.allocationPerTradeUsd} base)`}
              </strong>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>Min Execution Floor:</span>
              <strong className="text-[#D9F99D]">
                ${Math.max(1, vaultConfig.minTradeSizeUsd || 1).toFixed(2)} USD Min
              </strong>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span>MEV Protection:</span>
              <strong className="text-[#D9F99D]">
                {vaultConfig.jitoMevProtection ? 'Jito Bundle Active' : 'Off'}
              </strong>
            </div>
            <div className="flex justify-between items-center text-zinc-400 text-[11px]">
              <span>Min LP Lock:</span>
              <strong className="text-[#D9F99D]">≥ {vaultConfig.minLpLockedPercent}%</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
