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
  Layers
} from 'lucide-react';
import { Chain, LiveWalletState, TradingMode } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';

interface NavbarProps {
  autoTradeEnabled: boolean;
  onToggleAutoTrade: () => void;
  audioAlerts: boolean;
  onToggleAudio: () => void;
  onOpenDeposit: () => void;
  onOpenStrategy: () => void;
  onOpenStrategyTab?: (tab: 'sizing' | 'execution' | 'scrutiny') => void;
  onOpenWallet: () => void;
  onLockTerminal?: () => void;
  onToggleTradingMode?: () => void;
  liveWallet: LiveWalletState;
  tradingMode: TradingMode;
  activePositionsCount: number;
  activeChains: Record<Chain, boolean>;
}

export const Navbar: React.FC<NavbarProps> = ({
  autoTradeEnabled,
  onToggleAutoTrade,
  audioAlerts,
  onToggleAudio,
  onOpenDeposit,
  onOpenStrategy,
  onOpenStrategyTab,
  onOpenWallet,
  onLockTerminal,
  onToggleTradingMode,
  liveWallet,
  tradingMode,
  activePositionsCount,
  activeChains,
}) => {
  const isAnyWalletConnected = Boolean(liveWallet?.isConnected);

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
              <button
                type="button"
                onClick={onToggleTradingMode}
                title="Toggle between Live On-Chain Mainnet and Simulation Sandbox (Isolated State)"
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-bold tracking-widest uppercase cursor-pointer transition-all hover:scale-105 ${
                  tradingMode === 'LIVE_MAINNET' 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]' 
                    : 'bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/40 shadow-[0_0_8px_rgba(217,249,157,0.15)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tradingMode === 'LIVE_MAINNET' ? 'bg-red-400 animate-pulse' : 'bg-[#D9F99D]'}`} />
                {tradingMode === 'LIVE_MAINNET' ? 'LIVE MAINNET' : 'SANDBOX'}
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-[#D9F99D]/60 tracking-wider hidden xs:block uppercase">
              Autonomous Multi-Chain Terminal
            </p>
          </div>
        </div>

        {/* Navigation Tabs for Strategy & Auto-Snipe */}
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
        </div>

        {/* Live Network & Chain Health Status in Bento Terminal Style */}
        <div className="hidden xl:flex items-center gap-3 text-[10px] uppercase tracking-widest border border-white/5 bg-[#0A0A0A] px-3 py-1.5 rounded-full">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeChains?.solana ? 'bg-[#D9F99D] animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-zinc-300 font-semibold">SOL</span>
            <span className="text-[#D9F99D] font-bold text-[9px]">{CHAINS_CONFIG.solana.tpsOrSpeed}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeChains?.bnb ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-zinc-300 font-semibold">BNB</span>
            <span className="text-amber-400 font-bold text-[9px]">{CHAINS_CONFIG.bnb.avgGas}</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeChains?.robinhood ? 'bg-[#D9F99D] animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-zinc-300 font-semibold">RH-CHAIN</span>
            <span className="text-[#D9F99D] font-bold text-[9px]">4663</span>
          </div>
        </div>

        {/* Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Chain Dynamic Balance Display */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0A0A0A] border border-white/10 text-xs">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Balance:</span>
            <span className="text-[#D9F99D] font-bold font-mono">
              {liveWallet.chain === 'solana'
                ? `${(liveWallet.balances.sol || 0).toFixed(3)} SOL`
                : liveWallet.chain === 'bnb'
                ? `${(liveWallet.balances.bnb || 0).toFixed(3)} BNB`
                : `${((liveWallet.balances.usdc || 0) / 2600).toFixed(3)} ETH`}
            </span>
          </div>

          {/* Live Wallet Connection Button */}
          <button
            id="btn-nav-wallet-modal"
            onClick={onOpenWallet}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              isAnyWalletConnected
                ? 'border-[#D9F99D]/60 bg-[#D9F99D]/15 text-[#D9F99D] hover:bg-[#D9F99D]/25 shadow-[0_0_10px_rgba(217,249,157,0.15)]'
                : 'border-white/20 bg-zinc-900 text-zinc-300 hover:border-[#D9F99D]/50 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            {isAnyWalletConnected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9F99D] animate-pulse shrink-0" />
                <span className="hidden sm:inline">
                  {liveWallet.address 
                    ? `${liveWallet.address.slice(0, 4)}...${liveWallet.address.slice(-4)}`
                    : 'Connected'}
                </span>
                <span className="sm:hidden text-[11px]">
                  {liveWallet.address ? `${liveWallet.address.slice(0, 3)}...` : 'Wallet'}
                </span>
              </span>
            ) : (
              <span className="text-[11px] sm:text-xs">Connect</span>
            )}
          </button>

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
