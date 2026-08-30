import React from 'react';
import { 
  Sliders, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  Pause, 
  Zap, 
  Wallet,
  Activity,
  Lock,
  Crosshair,
  ShieldAlert,
  Layers,
  Radio
} from 'lucide-react';
import { Chain, LiveWalletState, TradingMode, ValidatorSyncTelemetry } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';

interface NavbarProps {
  autoTradeEnabled: boolean;
  onToggleAutoTrade: () => void;
  audioAlerts: boolean;
  onToggleAudio: () => void;
  onOpenDeposit: () => void;
  onOpenStrategy: () => void;
  onOpenStrategyTab?: (tab: 'sizing' | 'execution' | 'scrutiny') => void;
  onOpenVaultKeys?: () => void;
  onLockTerminal?: () => void;
  tradingMode: TradingMode;
  activePositionsCount: number;
  activeChains: Record<Chain, boolean>;
  validatorTelemetry?: ValidatorSyncTelemetry | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  autoTradeEnabled,
  onToggleAutoTrade,
  audioAlerts,
  onToggleAudio,
  onOpenDeposit,
  onOpenStrategy,
  onOpenStrategyTab,
  onOpenVaultKeys,
  onLockTerminal,
  tradingMode,
  activePositionsCount,
  activeChains,
  validatorTelemetry,
}) => {
  const handleOpenTab = (tab: 'sizing' | 'execution' | 'scrutiny') => {
    if (onOpenStrategyTab) {
      onOpenStrategyTab(tab);
    } else {
      onOpenStrategy();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D9F99D]/20 bg-[#050505]/95 backdrop-blur-md font-mono">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D9F99D] rounded-md flex items-center justify-center text-black font-black text-lg sm:text-xl shadow-[0_0_15px_rgba(217,249,157,0.3)]">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-black tracking-tighter text-white">
                RAW<span className="text-[#D9F99D]">SIGHT</span>
              </span>
              <div
                title="Production Live Mainnet Mode"
                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PRODUCTION MAINNET</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-[#D9F99D]/60 tracking-wider hidden xs:block uppercase">
              Autonomous Multi-Chain Terminal
            </p>
          </div>
        </div>

        {/* Live Helius + QuickNode 1s Validator Pulse & Telemetry Status */}
        <div 
          className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-950/80 border border-[#D9F99D]/30 text-[10px] uppercase tracking-wider shadow-sm shadow-[#D9F99D]/5"
          title="Helius (Solana) + QuickNode (EVM) 1-Second On-Chain Confirmation Stream"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[#D9F99D] font-black flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#D9F99D] animate-pulse" />
            HELIUS + QUICKNODE:
          </span>
          <span className="text-purple-300 font-mono font-bold" title="Helius Solana Validator Confirmation">
            {validatorTelemetry?.solanaSlot ? `SOL #${validatorTelemetry.solanaSlot}` : 'HELIUS SYNCED'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-300 font-mono font-bold" title="QuickNode BSC Validator Confirmation">
            {validatorTelemetry?.bscBlock ? `BSC #${validatorTelemetry.bscBlock}` : 'QN SYNCED'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-cyan-300 font-mono font-bold" title="Robinhood EVM Node Confirmation">
            {validatorTelemetry?.robinhoodBlock ? `RH #${validatorTelemetry.robinhoodBlock}` : 'RH SYNCED'}
          </span>
          <span className="text-emerald-400 font-bold ml-1">
            ({validatorTelemetry?.avgLatencyMs || 24}ms)
          </span>
        </div>

        {/* Navigation Tabs for Strategy, Auto-Snipe & Vault Keys */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            id="nav-tab-strategy"
            onClick={() => handleOpenTab('sizing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-zinc-300 bg-[#0A0A0A] border border-white/10 hover:border-[#D9F99D]/40 hover:text-[#D9F99D] transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D9F99D]" />
            <span>Sizing & Strategy</span>
          </button>

          <button
            type="button"
            id="nav-tab-autosnipe"
            onClick={() => handleOpenTab('execution')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-zinc-300 bg-[#0A0A0A] border border-white/10 hover:border-[#D9F99D]/40 hover:text-[#D9F99D] transition-all cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#D9F99D]" />
            <span>Auto-Snipe Rules</span>
          </button>

          {onOpenVaultKeys && (
            <button
              type="button"
              id="nav-tab-vault-keys"
              onClick={onOpenVaultKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-zinc-300 bg-[#0A0A0A] border border-white/10 hover:border-[#D9F99D]/40 hover:text-[#D9F99D] transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#D9F99D]" />
              <span>Vault Keys</span>
            </button>
          )}
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Chime Toggle */}
          <button
            id="btn-toggle-audio"
            onClick={onToggleAudio}
            title={audioAlerts ? 'Mute terminal audio' : 'Enable terminal audio alerts'}
            className={`hidden xs:flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-md border text-xs transition-colors cursor-pointer ${
              audioAlerts 
                ? 'border-[#D9F99D]/40 bg-[#D9F99D]/10 text-[#D9F99D] hover:bg-[#D9F99D]/20' 
                : 'border-zinc-800 bg-[#0A0A0A] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {audioAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Engine Active / Pause Toggle */}
          <button
            id="btn-toggle-engine"
            onClick={onToggleAutoTrade}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              autoTradeEnabled
                ? 'bg-[#D9F99D] text-black border-[#D9F99D] hover:bg-[#bef264]'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            {autoTradeEnabled ? (
              <>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-black shrink-0" />
                <span className="hidden xs:inline">ENGINE:</span> <span>ON</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="hidden xs:inline">ENGINE:</span> <span>OFF</span>
              </>
            )}
          </button>

          {/* Deposit Button */}
          <button
            id="btn-nav-deposit"
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 min-h-[44px] rounded-md text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-black shrink-0" />
            <span>Deposit</span>
          </button>

          {/* Lock Terminal Private Gate Button */}
          {onLockTerminal && (
            <button
              id="btn-lock-terminal"
              onClick={onLockTerminal}
              title="Lock Terminal & Purge RAM Session"
              className="flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-md border border-red-500/30 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-white transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
