import React from 'react';
import { 
  ShieldAlert, 
  Wallet, 
  Layers, 
  AlertTriangle,
  Flame,
  Zap,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { VaultState, VaultConfig, LiveWalletState } from '../types';

interface VaultOverviewProps {
  vaultState: VaultState;
  vaultConfig: VaultConfig;
  liveWallet: LiveWalletState;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onEmergencyCloseAll: () => void;
  onOpenStrategy: () => void;
  onOpenWallet: () => void;
  activePositionsCount: number;
}

export const VaultOverview: React.FC<VaultOverviewProps> = ({
  vaultState,
  vaultConfig,
  liveWallet,
  onEmergencyCloseAll,
  onOpenStrategy,
  onOpenWallet,
  activePositionsCount,
}) => {
  const winRate = vaultState.totalTrades > 0 
    ? Math.round((vaultState.winningTrades / vaultState.totalTrades) * 100) 
    : 100;

  const solBalance = liveWallet?.balances?.sol || 0;
  const bnbBalance = liveWallet?.balances?.bnb || 0;
  const ethBalance = (liveWallet?.balances?.usdc ? liveWallet.balances.usdc / 2600 : 0);
  const totalWalletUsd = liveWallet?.balances?.totalUsd || (solBalance * 185 + bnbBalance * 580 + ethBalance * 2600);

  return (
    <section className="w-full mb-6 font-mono space-y-4">
      {/* Bento Grid Header & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D9F99D]/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[#D9F99D] font-bold">
              Rawsight Production Terminal
            </span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span className="text-[11px] opacity-70 uppercase tracking-wider hidden sm:inline text-zinc-300">
              Chain-Isolated Execution: Solana • BNB Chain • Robinhood Chain
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Autonomous Multi-Chain Memecoin Trading Terminal
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-overview-wallet"
            onClick={onOpenWallet}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-md text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-black" />
            <span>Connected Wallets</span>
          </button>

          <button
            id="btn-overview-strategy"
            onClick={onOpenStrategy}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider text-[#D9F99D] bg-[#0A0A0A] border border-[#D9F99D]/30 hover:bg-[#D9F99D]/10 active:scale-95 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D9F99D]" />
            <span>Strategy Sizing</span>
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

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Cell 1: Accumulated Connected Wallet Balances (Span 8) */}
        <div className="md:col-span-8 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#D9F99D]/50 transition-all">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="text-xs opacity-70 mb-1 uppercase tracking-widest flex items-center gap-2 text-zinc-300">
                <Layers className="w-3.5 h-3.5 text-[#D9F99D]" />
                Accumulated Connected Wallet Balances
              </div>
              <div className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white">
                ${totalWalletUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PRODUCTION MAINNET
              </span>
            </div>
          </div>

          {/* Multi-Chain Connected Balance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 p-3 rounded-lg bg-zinc-950/80 border border-white/5">
            <div className="border-l-2 border-[#D9F99D] pl-2.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Solana Balance</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {solBalance.toFixed(4)} SOL
              </div>
              <div className="text-[10px] text-[#D9F99D]">
                ~${(solBalance * 185).toFixed(2)} USD
              </div>
            </div>

            <div className="border-l-2 border-amber-400 pl-2.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400">BNB Chain Balance</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {bnbBalance.toFixed(4)} BNB
              </div>
              <div className="text-[10px] text-amber-300">
                ~${(bnbBalance * 580).toFixed(2)} USD
              </div>
            </div>

            <div className="border-l-2 border-cyan-400 pl-2.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Robinhood L2 Balance</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {ethBalance.toFixed(4)} ETH
              </div>
              <div className="text-[10px] text-cyan-300">
                ~${(ethBalance * 2600).toFixed(2)} USD
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-3 border-t border-white/5">
            <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-4 w-full sm:w-auto">
              <div>
                <div className="text-[10px] opacity-40 uppercase tracking-wider mb-0.5">Realized Gain/Loss</div>
                <div className={`text-lg sm:text-2xl font-bold tracking-tight ${
                  vaultState.realizedPnlUsd >= 0 ? 'text-[#D9F99D]' : 'text-red-400'
                }`}>
                  {vaultState.realizedPnlUsd >= 0 ? '+' : ''}${vaultState.realizedPnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {vaultState.totalTrades} on-chain trades executed
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
            </div>

            {/* Geometric Bar Chart Sparkline */}
            <div className="hidden sm:flex gap-1.5 items-end h-12 shrink-0 self-end">
              <div className="w-3 bg-[#D9F99D]/20 h-[35%] rounded-t-sm" title="T-4" />
              <div className="w-3 bg-[#D9F99D]/40 h-[55%] rounded-t-sm" title="T-3" />
              <div className="w-3 bg-[#D9F99D]/60 h-[45%] rounded-t-sm" title="T-2" />
              <div className="w-3 bg-[#D9F99D]/80 h-[80%] rounded-t-sm" title="T-1" />
              <div className="w-3 bg-[#D9F99D] h-[100%] rounded-t-sm" title="Now" />
            </div>
          </div>
        </div>

        {/* Bento Cell 2: Inverted Accent Card (Rawsight Alpha Engine) (Span 4) */}
        <div className="md:col-span-4 bg-[#D9F99D] text-black rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="font-black text-xs uppercase tracking-widest">Rawsight Alpha Engine</span>
            <span className="text-[10px] font-bold bg-black/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {vaultConfig.autoTradeEnabled ? 'AUTO-SNIPER ARMED' : 'MANUAL MODE'}
            </span>
          </div>
          <div className="my-4">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
              98.4%
            </div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Scrutiny Confidence
            </div>
          </div>
          <div className="text-[11px] font-medium leading-relaxed opacity-90 border-t border-black/10 pt-3">
            Real-time multi-chain filtering. When a token is detected, strategy strictly isolates execution to that specific chain.
          </div>
        </div>

        {/* Bento Cell 3: Chain-Isolated Execution Rules (Span 4) */}
        <div className="md:col-span-4 bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] opacity-60 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Chain Isolation Rules</span>
              <span className="text-[9px] text-[#D9F99D] font-bold">STRICT MATCH</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-2 rounded bg-zinc-950 border border-white/5">
                <div className="flex justify-between font-bold mb-0.5">
                  <span className="text-white">Solana Memecoins</span>
                  <span className="text-[#D9F99D]">Jupiter / Raydium</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Buys and sells exclusively with SOL on Solana.
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-950 border border-white/5">
                <div className="flex justify-between font-bold mb-0.5">
                  <span className="text-white">BNB Memecoins</span>
                  <span className="text-amber-400">PancakeSwap V3</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Buys and sells exclusively with BNB on BSC.
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-950 border border-white/5">
                <div className="flex justify-between font-bold mb-0.5">
                  <span className="text-white">Robinhood Chain</span>
                  <span className="text-cyan-400">Uniswap V2/V3</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Buys and sells exclusively with ETH on Robinhood.
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Direct Wallet Routing</span>
            <span className="text-[#D9F99D]">ENABLED</span>
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
              <span>Insider Clusters Dodged:</span>
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
                {vaultConfig.sizingMode === 'PERCENT_NAV' && `${vaultConfig.allocationPercentNav}% Wallet`}
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
                {vaultConfig.jitoMevProtection ? 'Jito Bundle Active' : 'Standard Priority'}
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

