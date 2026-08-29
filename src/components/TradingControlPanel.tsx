import React, { useState } from 'react';
import { 
  Zap, 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  Wallet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Layers, 
  AlertOctagon, 
  Search,
  ExternalLink,
  Flame,
  BarChart3,
  Lock,
  DollarSign
} from 'lucide-react';
import { VaultConfig, LiveWalletState, GasPriority, MemeToken } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { inspectLiveContractAddress } from '../lib/dexScreener';

interface TradingControlPanelProps {
  config: VaultConfig;
  onUpdateConfig: (newConfig: Partial<VaultConfig>) => void;
  liveWallet: LiveWalletState;
  cashBalanceUsd: number;
  totalNavUsd: number;
  activePositionsCount: number;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenStrategy: () => void;
  onOpenWallet: () => void;
  onEmergencyCloseAll: () => void;
  onSnipeCustomToken?: (token: MemeToken) => void;
}

export const TradingControlPanel: React.FC<TradingControlPanelProps> = ({
  config,
  onUpdateConfig,
  liveWallet,
  cashBalanceUsd,
  totalNavUsd,
  activePositionsCount,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenStrategy,
  onOpenWallet,
  onEmergencyCloseAll,
  onSnipeCustomToken,
}) => {
  const [quickCaInput, setQuickCaInput] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMsg, setAuditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleQuickAuditAndSnipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCaInput.trim()) return;

    setIsAuditing(true);
    setAuditMsg(null);

    try {
      const inspected = await inspectLiveContractAddress(quickCaInput.trim());
      if (inspected) {
        setAuditMsg({ type: 'success', text: `Verified ${inspected.symbol} (${inspected.name}) on ${inspected.chain.toUpperCase()}!` });
        if (onSnipeCustomToken) {
          onSnipeCustomToken(inspected);
        }
        setQuickCaInput('');
      } else {
        setAuditMsg({ type: 'error', text: 'Contract address not found on live liquidity pools.' });
      }
    } catch {
      setAuditMsg({ type: 'error', text: 'Network or RPC query error while verifying CA.' });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* SECTION B: Real-Time Trading & Auto-Sniper Module */}
      <div className="bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/30 flex items-center justify-center text-[#D9F99D]">
              <Zap className="w-4 h-4 fill-[#D9F99D]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                AUTO-SNIPER & EXECUTION
              </h3>
              <p className="text-[10px] text-zinc-400">
                Low Latency Memecoin Trading Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => onUpdateConfig({ autoTradeEnabled: !config.autoTradeEnabled })}
            className={`px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
              config.autoTradeEnabled
                ? 'bg-[#D9F99D] text-black border-[#D9F99D] shadow-lg shadow-[#D9F99D]/20'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${config.autoTradeEnabled ? 'fill-black' : ''}`} />
            <span>{config.autoTradeEnabled ? 'ARMED' : 'PAUSED'}</span>
          </button>
        </div>

        {/* Execution Mode & Slippage Settings */}
        <div className="space-y-3 my-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 uppercase text-[11px] font-bold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-[#D9F99D]" />
              Slippage Tolerance
            </span>
            <span className="text-[#D9F99D] font-bold">{config.slippageTolerancePercent}%</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {[1.0, 3.0, 5.0, 10.0].map((slip) => (
              <button
                key={slip}
                type="button"
                onClick={() => onUpdateConfig({ slippageTolerancePercent: slip })}
                className={`py-1.5 min-h-[44px] rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  config.slippageTolerancePercent === slip
                    ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                    : 'border-white/5 bg-[#050505] text-zinc-400 hover:text-white'
                }`}
              >
                {slip}%
              </button>
            ))}
          </div>

          {/* Gas & Priority Level */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400 uppercase text-[11px] font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#D9F99D]" />
                Priority Fee / MEV Tip
              </span>
              <span className="text-zinc-300 font-bold">{config.gasPriority}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {(['NORMAL', 'FAST', 'TURBO', 'ULTRA'] as GasPriority[]).map((prio) => (
                <button
                  key={prio}
                  type="button"
                  onClick={() => onUpdateConfig({ gasPriority: prio })}
                  className={`py-1.5 min-h-[44px] rounded-lg text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                    config.gasPriority === prio
                      ? 'border-[#D9F99D] bg-[#D9F99D]/20 text-[#D9F99D]'
                      : 'border-white/5 bg-[#050505] text-zinc-400 hover:text-white'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
          </div>

          {/* Position Sizing Settings */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px]">Trade Size (NAV %):</span>
            <span className="text-white font-bold">{config.allocationPercentNav}% (${((totalNavUsd * config.allocationPercentNav) / 100).toFixed(0)})</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px]">Take-Profit Target:</span>
            <span className="text-emerald-400 font-bold">+{config.takeProfitPercent}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 text-[11px]">Trailing Stop:</span>
            <span className="text-[#D9F99D] font-bold">
              {config.trailingStopEnabled ? `${config.trailingStopDistance}% pullback` : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Quick Instant Snipe Form by Token Address */}
        <div className="pt-3 border-t border-white/5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1.5">
            Quick Snipe by Contract Address (CA)
          </label>
          <form onSubmit={handleQuickAuditAndSnipe} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={quickCaInput}
                onChange={(e) => setQuickCaInput(e.target.value)}
                placeholder="Paste Token Mint (Solana) or Token CA (EVM)..."
                className="w-full bg-[#050505] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9F99D]/60 min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              disabled={isAuditing || !quickCaInput.trim()}
              className="w-full py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-[#D9F99D]/15 border border-[#D9F99D]/40 text-[#D9F99D] hover:bg-[#D9F99D] hover:text-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAuditing ? 'Auditing CA...' : 'Audit & Prepare Snipe'}</span>
            </button>
          </form>

          {auditMsg && (
            <p className={`mt-2 text-[11px] ${auditMsg.type === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {auditMsg.text}
            </p>
          )}
        </div>

        {/* Strategy Configuration Trigger */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onOpenStrategy}
            className="w-full py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-[#D9F99D]/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D9F99D]" />
            <span>Customize Vault Strategy Rules</span>
          </button>
        </div>
      </div>

      {/* SECTION C: On-Chain Wallet Balance & Production Withdrawal Engine */}
      <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-4 sm:p-5 shadow-2xl font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/30 flex items-center justify-center text-[#D9F99D]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                CONNECTED WALLET & BALANCES
              </h3>
              <p className="text-[10px] text-zinc-400">
                Live Multi-Chain Trading Liquidity
              </p>
            </div>
          </div>

          <button
            onClick={onOpenWallet}
            className="text-[11px] font-bold text-[#D9F99D] hover:underline cursor-pointer min-h-[44px] flex items-center"
          >
            {liveWallet.isConnected ? 'Wallet Settings' : 'Connect Wallet'}
          </button>
        </div>

        {/* Available Liquidity Summary */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-[#050505] border border-white/5">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase block">Available Cash</span>
            <span className="text-base font-black text-white">${cashBalanceUsd.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase block">Total Vault NAV</span>
            <span className="text-base font-black text-[#D9F99D]">${totalNavUsd.toFixed(2)}</span>
          </div>
        </div>

        {/* Multi-Chain Breakdown */}
        <div className="space-y-1.5 my-3 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-white/5">
            <span className="text-zinc-400">Solana Balance (SOL):</span>
            <span className="text-white font-bold">{liveWallet.balances.sol.toFixed(3)} SOL</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-white/5">
            <span className="text-zinc-400">BNB Balance (BNB):</span>
            <span className="text-white font-bold">{liveWallet.balances.bnb.toFixed(3)} BNB</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-white/5">
            <span className="text-zinc-400">USDC / USDT Stable:</span>
            <span className="text-white font-bold">${liveWallet.balances.usdc.toFixed(2)}</span>
          </div>
        </div>

        {/* Deposit & Withdraw Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] transition-all shadow-md shadow-[#D9F99D]/10 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Deposit</span>
          </button>

          <button
            onClick={onOpenWithdraw}
            className="flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-[#050505] border border-white/10 text-white hover:border-[#D9F99D]/40 transition-all cursor-pointer"
          >
            <ArrowUpFromLine className="w-4 h-4 text-[#D9F99D]" />
            <span>Withdraw</span>
          </button>
        </div>

        {/* Emergency Panic Liquidate Button */}
        {activePositionsCount > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <button
              onClick={onEmergencyCloseAll}
              className="w-full py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/40 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Emergency Liquidate All ({activePositionsCount} Positions)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
