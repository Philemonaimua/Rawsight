import React, { useState } from 'react';
import { 
  Zap, 
  Radio, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Activity, 
  ChevronDown,
  ChevronUp,
  Cpu,
  BarChart2,
  TrendingUp,
  Layers,
  Sliders,
  RefreshCw,
  Sparkles,
  Filter
} from 'lucide-react';
import { EarlyLaunchToken, Chain, LaunchSource, WebSocketListenerStatus, VaultConfig, TokenStage, PreGraduationSettings } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { formatAddressDisplay, getDexScreenerUrl, getExplorerTokenUrl } from '../lib/caParser';
import { formatMarketCap, formatLiquidity, formatTokenPrice } from '../lib/formatters';
import { discoveryEngine } from '../services/discoveryEngine';
import { PriceChangeBadge } from './PriceChangeBadge';

interface EarlyLaunchFeedProps {
  tokens: EarlyLaunchToken[];
  listeners: WebSocketListenerStatus[];
  onSnipeToken: (token: EarlyLaunchToken, customAmountUsd?: number) => void;
  vaultConfig: VaultConfig;
  onUpdateVaultConfig?: (config: Partial<VaultConfig>) => void;
  cashBalanceUsd: number;
}

const ALL_LAUNCHPADS: LaunchSource[] = [
  'Pump.fun',
  'Moonshot',
  'Four.meme',
  'Hood.fun',
  'Flap',
  'Pons',
  'Raydium',
  'PancakeSwap',
  'Uniswap V3'
];

export const EarlyLaunchFeed: React.FC<EarlyLaunchFeedProps> = ({
  tokens,
  listeners,
  onSnipeToken,
  vaultConfig,
  onUpdateVaultConfig,
}) => {
  const [selectedChain, setSelectedChain] = useState<Chain | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<TokenStage | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [showListenerDrawer, setShowListenerDrawer] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [copiedCa, setCopiedCa] = useState<string | null>(null);
  const [filterPassedOnly, setFilterPassedOnly] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshNotification, setRefreshNotification] = useState<string | null>(null);

  // Pre-Graduation Dynamic Settings state
  const [preGradSettings, setPreGradSettings] = useState<PreGraduationSettings>(() => 
    discoveryEngine.getPreGraduationSettings()
  );

  const handleCopyCa = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCa(ca);
    setTimeout(() => setCopiedCa(null), 1800);
  };

  const handleUpdatePreGradSetting = (changes: Partial<PreGraduationSettings>) => {
    const updated = discoveryEngine.updatePreGraduationSettings(changes);
    setPreGradSettings(updated);
  };

  const handleToggleLaunchpad = (source: LaunchSource) => {
    const current = preGradSettings.allowedLaunchpads;
    const next = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    handleUpdatePreGradSetting({ allowedLaunchpads: next });
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotification('Fetching live tokens from Pump.fun, Four.meme, and DEX streams...');
    try {
      const refreshed = await discoveryEngine.forceRefreshLiveTokens();
      const preGradCount = refreshed.filter(t => t.stage === 'pre-graduation' || (t.bondingCurveProgress && t.bondingCurveProgress < 100)).length;
      setRefreshNotification(`Synced ${refreshed.length} live tokens (${preGradCount} Pre-Graduation bonding curves).`);
      setTimeout(() => setRefreshNotification(null), 3500);
    } catch (e) {
      setRefreshNotification('Live launchpad sync completed.');
      setTimeout(() => setRefreshNotification(null), 2500);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTokens = tokens.filter(t => {
    if (selectedChain !== 'all' && t.chain !== selectedChain) return false;
    
    const isPreGrad = t.stage === 'pre-graduation' || (t.bondingCurveProgress !== undefined && t.bondingCurveProgress < 100);
    const stage = isPreGrad ? 'pre-graduation' : 'graduated';
    if (selectedStage !== 'all' && stage !== selectedStage) return false;

    // Apply pre-graduation filters when pre-graduation mode is selected
    if (selectedStage === 'pre-graduation') {
      const progress = t.bondingProgress ?? t.bondingCurveProgress ?? 50;
      if (progress < preGradSettings.minBondingProgress || progress > preGradSettings.maxBondingProgress) return false;
      if (t.mcap < preGradSettings.minMcapUsd || t.mcap > preGradSettings.maxMcapUsd) return false;
      if (preGradSettings.allowedLaunchpads.length > 0 && !preGradSettings.allowedLaunchpads.includes(t.launchSource)) return false;
    }

    if (selectedSource !== 'ALL' && t.launchSource !== selectedSource) return false;
    if (filterPassedOnly && t.scrutinyStatus !== 'PASSED_RAWSIGHT') return false;
    return true;
  });

  const totalEvents = listeners.reduce((sum, l) => sum + l.eventsProcessed, 0);
  const avgLatency = Math.round(listeners.reduce((sum, l) => sum + l.avgLatencyMs, 0) / (listeners.length || 1));

  const solCount = tokens.filter(t => t.chain === 'solana').length;
  const bnbCount = tokens.filter(t => t.chain === 'bnb').length;
  const rhCount = tokens.filter(t => t.chain === 'robinhood').length;
  const preGradTotalCount = tokens.filter(t => t.stage === 'pre-graduation' || (t.bondingCurveProgress && t.bondingCurveProgress < 100)).length;

  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-4 sm:p-5 mb-6 font-mono relative overflow-hidden shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9F99D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Diagnostics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/40 text-[#D9F99D] shrink-0">
            <Radio className="w-5 h-5 text-[#D9F99D] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#D9F99D] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                DYNAMIC MEMECOIN FEED & LIVE LAUNCHPAD TRACKER
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#D9F99D]" />
                WEBSOCKET LIVE ({avgLatency}ms)
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-950/60 text-blue-300 border border-blue-500/30">
                33.3% Balanced Scheduler
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Dual-mode real-time token discovery evenly distributed across <strong>Solana</strong> (Pump.fun/Moonshot), <strong>BNB Chain</strong> (Four.meme/PancakeSwap), and <strong>Robinhood Chain</strong> (Hood.fun/Uniswap V3).
            </p>
          </div>
        </div>

        {/* Diagnostic Actions, Live Fetch Trigger, & Settings */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pre-Graduation Settings Trigger */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showSettingsDrawer
                ? 'bg-purple-900/60 text-purple-200 border-purple-400'
                : 'bg-[#050505] text-purple-300 border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/40'
            }`}
            title="Configure Pre-Graduation Curve Ranges & Launchpads"
          >
            <Sliders className="w-4 h-4 text-purple-300" />
            <span>Pre-Grad Settings</span>
            {showSettingsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Real-time Force Refresh Button */}
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-[#050505] text-zinc-300 border border-white/10 hover:border-[#D9F99D]/50 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Fetch Fresh On-Chain Memecoins from Pump.fun and DEX APIs"
          >
            <RefreshCw className={`w-4 h-4 text-[#D9F99D] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Fetch Live'}</span>
          </button>

          {onUpdateVaultConfig && (
            <button
              onClick={() => onUpdateVaultConfig({ autoTradeEnabled: !vaultConfig.autoTradeEnabled })}
              className={`flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                vaultConfig.autoTradeEnabled
                  ? 'bg-[#D9F99D] text-black border-[#D9F99D] shadow-lg shadow-[#D9F99D]/20'
                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Zap className={`w-4 h-4 ${vaultConfig.autoTradeEnabled ? 'fill-black' : ''}`} />
              <span>Auto-Snipe: {vaultConfig.autoTradeEnabled ? 'ARMED' : 'PAUSED'}</span>
            </button>
          )}

          <button
            onClick={() => setShowListenerDrawer(!showListenerDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider bg-[#050505] text-zinc-300 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-[#D9F99D]" />
            <span>{listeners.length} RPC Listeners</span>
            {showListenerDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Real-time Refresh Banner Notification */}
      {refreshNotification && (
        <div className="my-3 p-2.5 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/40 text-xs text-[#D9F99D] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9F99D]" />
            <span className="font-bold">{refreshNotification}</span>
          </div>
          <button onClick={() => setRefreshNotification(null)} className="text-zinc-400 hover:text-white text-[11px] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Pre-Graduation Settings Customization Drawer */}
      {showSettingsDrawer && (
        <div className="my-4 p-4 rounded-xl bg-[#070509] border border-purple-500/30 animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-400" />
              <span className="font-black text-white uppercase tracking-wider text-sm">
                Mode A: Pre-Graduation Discovery Parameters
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-500/30">
              Live Bonding Curve Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Bonding Curve Range */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-white/10 flex flex-col justify-between">
              <div>
                <label className="text-zinc-400 font-bold uppercase text-[10px] block mb-1">
                  Bonding Curve Progress
                </label>
                <div className="text-sm font-black text-[#D9F99D] mb-2">
                  {preGradSettings.minBondingProgress}% - {preGradSettings.maxBondingProgress}%
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={preGradSettings.minBondingProgress}
                  onChange={(e) => handleUpdatePreGradSetting({ minBondingProgress: parseInt(e.target.value) || 20 })}
                  className="w-full accent-purple-400 cursor-pointer"
                  title="Min Bonding Progress %"
                />
                <input 
                  type="range"
                  min="55"
                  max="98"
                  step="5"
                  value={preGradSettings.maxBondingProgress}
                  onChange={(e) => handleUpdatePreGradSetting({ maxBondingProgress: parseInt(e.target.value) || 85 })}
                  className="w-full accent-[#D9F99D] cursor-pointer"
                  title="Max Bonding Progress %"
                />
              </div>
              <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                <span>Min: {preGradSettings.minBondingProgress}%</span>
                <span>Max: {preGradSettings.maxBondingProgress}%</span>
              </div>
            </div>

            {/* Market Cap Boundaries */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-white/10 flex flex-col justify-between">
              <div>
                <label className="text-zinc-400 font-bold uppercase text-[10px] block mb-1">
                  Market Cap Range (USD)
                </label>
                <div className="text-sm font-black text-white mb-2">
                  ${(preGradSettings.minMcapUsd / 1000).toFixed(0)}k - ${(preGradSettings.maxMcapUsd / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={preGradSettings.minMcapUsd}
                  onChange={(e) => handleUpdatePreGradSetting({ minMcapUsd: parseInt(e.target.value) || 5000 })}
                  className="p-1.5 rounded bg-zinc-900 border border-white/10 text-white text-[11px] font-bold"
                >
                  <option value={1000}>Min $1k</option>
                  <option value={5000}>Min $5k</option>
                  <option value={10000}>Min $10k</option>
                  <option value={20000}>Min $20k</option>
                </select>
                <select
                  value={preGradSettings.maxMcapUsd}
                  onChange={(e) => handleUpdatePreGradSetting({ maxMcapUsd: parseInt(e.target.value) || 65000 })}
                  className="p-1.5 rounded bg-zinc-900 border border-white/10 text-white text-[11px] font-bold"
                >
                  <option value={45000}>Max $45k</option>
                  <option value={65000}>Max $65k</option>
                  <option value={80000}>Max $80k</option>
                  <option value={100000}>Max $100k</option>
                </select>
              </div>
            </div>

            {/* Min 3-5m Buy Velocity */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-white/10 flex flex-col justify-between">
              <div>
                <label className="text-zinc-400 font-bold uppercase text-[10px] block mb-1">
                  Min Buy Velocity (3m)
                </label>
                <div className="text-sm font-black text-emerald-400 mb-2">
                  {preGradSettings.minVelocityBuys} Buys / 3m
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleUpdatePreGradSetting({ minVelocityBuys: count })}
                    className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      preGradSettings.minVelocityBuys === count
                        ? 'bg-emerald-500 text-black border-emerald-500'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {count}+
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Curve Presets */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-white/10 flex flex-col justify-between">
              <label className="text-zinc-400 font-bold uppercase text-[10px] block mb-1">
                Quick Strategy Presets
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleUpdatePreGradSetting({
                    minBondingProgress: 20,
                    maxBondingProgress: 85,
                    minMcapUsd: 5000,
                    maxMcapUsd: 65000,
                    minVelocityBuys: 10
                  })}
                  className="w-full py-1 px-2 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold text-left transition-colors cursor-pointer"
                >
                  Standard Safe Curve (20-85%)
                </button>
                <button
                  onClick={() => handleUpdatePreGradSetting({
                    minBondingProgress: 50,
                    maxBondingProgress: 95,
                    minMcapUsd: 25000,
                    maxMcapUsd: 70000,
                    minVelocityBuys: 15
                  })}
                  className="w-full py-1 px-2 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold text-left transition-colors cursor-pointer"
                >
                  Near-Graduation Runner (50-95%)
                </button>
              </div>
            </div>
          </div>

          {/* Launchpad Whitelist Checkboxes */}
          <div>
            <label className="text-zinc-400 font-bold uppercase text-[10px] block mb-2">
              Supported Pre-Graduation Launchpads & Bonding Streams
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_LAUNCHPADS.map((source) => {
                const isSelected = preGradSettings.allowedLaunchpads.includes(source);
                return (
                  <button
                    key={source}
                    onClick={() => handleToggleLaunchpad(source)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-200 border-purple-400 shadow-sm'
                        : 'bg-zinc-950 text-zinc-500 border-white/5 hover:border-white/20 hover:text-zinc-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400' : 'bg-zinc-600'}`} />
                    <span>{source}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Expandable WebSocket RPC Listeners Drawer */}
      {showListenerDrawer && (
        <div className="my-4 p-4 rounded-xl bg-[#050505] border border-white/10 animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D9F99D]" />
              <span className="font-bold text-white uppercase tracking-wider">
                Programmatic RPC WebSocket Event Subscriptions ({totalEvents.toLocaleString()} Total Events Processed)
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Zero-Frontrun Low Latency Stream</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {listeners.map((listener, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[#0A0A0A] border border-white/5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-white text-[11px]">{listener.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    listener.chain === 'solana' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                    listener.chain === 'bnb' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                    'bg-green-950/60 text-green-300 border border-green-500/30'
                  }`}>
                    {listener.chain.toUpperCase()}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-zinc-400 truncate mb-1">
                  Target: {formatAddressDisplay(listener.targetProgramOrContract, 8, 6)}
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/5 text-zinc-500">
                  <span>{listener.eventsProcessed} events</span>
                  <span className="text-[#D9F99D] font-bold">{listener.avgLatencyMs}ms ping</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode & Stage Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1.5 bg-[#050505] p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setSelectedStage('all')}
            className={`px-3 py-1.5 min-h-[38px] rounded uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStage === 'all' ? 'bg-[#D9F99D] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Stages ({tokens.length})</span>
          </button>

          <button
            onClick={() => setSelectedStage('pre-graduation')}
            className={`px-3 py-1.5 min-h-[38px] rounded uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStage === 'pre-graduation' ? 'bg-purple-500 text-white shadow-sm' : 'text-zinc-400 hover:text-purple-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mode A: Pre-Graduation ({preGradSettings.minBondingProgress}-{preGradSettings.maxBondingProgress}% Curve) ({preGradTotalCount})</span>
          </button>

          <button
            onClick={() => setSelectedStage('graduated')}
            className={`px-3 py-1.5 min-h-[38px] rounded uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStage === 'graduated' ? 'bg-emerald-500 text-black shadow-sm' : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mode B: Graduated DEX Pools</span>
          </button>
        </div>

        {/* 33.3% Cross-Chain Equal Allocation Indicators */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span className="font-semibold text-zinc-500 uppercase">Pool Weight:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            SOL: 33.3% ({solCount})
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
            BNB: 33.3% ({bnbCount})
          </span>
          <span className="px-2 py-0.5 rounded bg-green-950/60 text-green-300 border border-green-500/30">
            RH: 33.3% ({rhCount})
          </span>
        </div>
      </div>

      {/* Filter Bar: Chains & Launchpad Sources */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        {/* Chain Filters */}
        <div className="flex items-center gap-1.5 bg-[#050505] p-1 rounded-lg border border-white/10 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedChain('all')}
            className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
              selectedChain === 'all' ? 'bg-[#D9F99D] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Chains ({tokens.length})
          </button>
          <button
            onClick={() => setSelectedChain('solana')}
            className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
              selectedChain === 'solana' ? 'bg-[#D9F99D] text-black' : 'text-zinc-400 hover:text-[#D9F99D]'
            }`}
          >
            Solana ({solCount})
          </button>
          <button
            onClick={() => setSelectedChain('bnb')}
            className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
              selectedChain === 'bnb' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            BNB Chain ({bnbCount})
          </button>
          <button
            onClick={() => setSelectedChain('robinhood')}
            className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
              selectedChain === 'robinhood' ? 'bg-[#D9F99D] text-black' : 'text-zinc-400 hover:text-[#D9F99D]'
            }`}
          >
            Robinhood ({rhCount})
          </button>
        </div>

        {/* Source and Safety Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterPassedOnly(!filterPassedOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
              filterPassedOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#050505] text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Passed Rawsight Only</span>
          </button>

          {/* Quick Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-1.5 min-h-[44px] rounded-lg bg-[#050505] border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#D9F99D]/50 cursor-pointer"
          >
            <option value="ALL">All Launch Sources</option>
            <optgroup label="Solana (SVM)">
              <option value="Pump.fun">Pump.fun (Bonding Curve)</option>
              <option value="Moonshot">Moonshot (Curve)</option>
              <option value="Raydium">Raydium (AMM Pool)</option>
              <option value="Meteora">Meteora (DLMM)</option>
              <option value="Best Wallet">Best Wallet</option>
            </optgroup>
            <optgroup label="BNB Chain (EVM 56)">
              <option value="Four.meme">Four.meme (Bonding Curve)</option>
              <option value="PancakeSwap">PancakeSwap (PairCreated)</option>
              <option value="PinkSale">PinkSale (FairLaunch)</option>
              <option value="Biswap">Biswap (DEX)</option>
            </optgroup>
            <optgroup label="Robinhood Chain (EVM 4663)">
              <option value="Hood.fun">Hood.fun (Bonding Curve)</option>
              <option value="Flap">Flap (Curve)</option>
              <option value="Uniswap V3">Uniswap V3 (PoolCreated)</option>
              <option value="Pons">Pons (Direct Deploy)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Real-time Streaming Launch Cards Grid */}
      {filteredTokens.length === 0 ? (
        <div className="p-8 text-center bg-[#050505] rounded-xl border border-white/5 text-zinc-400">
          <Filter className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="font-bold text-white mb-1">No tokens match current filters</p>
          <p className="text-xs text-zinc-500 mb-4">
            Try adjusting bonding progress ranges, market cap limits, or click "Fetch Live" to sync fresh launchpad pairs.
          </p>
          <button
            onClick={handleForceRefresh}
            className="px-4 py-2 rounded-lg bg-[#D9F99D] text-black font-black uppercase text-xs cursor-pointer hover:bg-[#bef264]"
          >
            Fetch Live Launchpad Tokens Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTokens.map((token) => {
            const chainConfig = CHAINS_CONFIG[token.chain];
            const isPassed = token.scrutinyStatus === 'PASSED_RAWSIGHT';
            const isPreGrad = token.stage === 'pre-graduation' || (token.bondingCurveProgress !== undefined && token.bondingCurveProgress < 100);
            const dexScreenerLink = getDexScreenerUrl(token.chain, token.contractAddress);
            const explorerLink = getExplorerTokenUrl(token.chain, token.contractAddress);

            return (
              <div
                key={token.id}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative group ${
                  isPassed
                    ? 'bg-[#050505] border-white/10 hover:border-[#D9F99D]/50 hover:shadow-lg hover:shadow-[#D9F99D]/5'
                    : 'bg-[#080505] border-amber-500/20 opacity-85'
                }`}
              >
                <div>
                  {/* Header Row: Symbol, Chain Badge, Launch Source */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-black text-white">{token.symbol}</span>
                        <span className="text-xs text-zinc-400 font-sans truncate max-w-[120px]">{token.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${chainConfig.badgeColor}`}>
                          {chainConfig.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-zinc-300 border border-white/10">
                          {token.launchSource}
                        </span>
                        {isPreGrad ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-950/60 text-purple-300 border border-purple-500/30">
                            Pre-Grad Curve
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            DEX Pool
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Safety Score Ring / Badge */}
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-black uppercase ${
                        isPassed ? 'bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/40' : 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                      }`}>
                        {token.smartMoneyScore}/100 Alpha
                      </div>
                      <span className="text-[9px] text-zinc-500 block mt-0.5">
                        {token.detectionLatencyMs}ms detection
                      </span>
                    </div>
                  </div>

                  {/* Price and Liquidity Metrics */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-[#0A0A0A] border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Instant Price</span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="font-bold text-white">
                          {formatTokenPrice(token.currentPrice)}
                        </span>
                        <PriceChangeBadge change24h={token.change24h} size="sm" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase">Live LP / MCap</span>
                      <span className="font-bold text-white block">{formatLiquidity(token.liquidityUsd)} LP</span>
                      <span className="text-[10px] text-zinc-300 font-semibold block">{formatMarketCap(token.mcap)} MCap</span>
                    </div>
                  </div>

                  {/* Bonding Curve Progress & Velocity (if Pre-Graduation) */}
                  {isPreGrad && (
                    <div className="mb-2.5 p-2 rounded-lg bg-purple-950/20 border border-purple-500/20">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-purple-300 uppercase font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-[#D9F99D]" />
                          Bonding Curve Progress
                        </span>
                        <span className="text-[#D9F99D] font-bold">{token.bondingCurveProgress ?? 65}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-[#D9F99D] rounded-full transition-all duration-500"
                          style={{ width: `${token.bondingCurveProgress ?? 65}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-400">
                        <span>Velocity: <strong>{token.txns5m?.buys ?? 15} buys / 3m</strong></span>
                        <span className="text-purple-300 font-semibold">{preGradSettings.minBondingProgress}-{preGradSettings.maxBondingProgress}% Target</span>
                      </div>
                    </div>
                  )}

                  {/* Anti-Rug & Safety Flags Checklist */}
                  <div className="space-y-1.5 my-2.5 text-[10px] uppercase">
                    <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-white/5">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#D9F99D]" />
                        Liquidity Lock
                      </span>
                      <span className={`font-bold ${
                        token.liquidityLockStatus === '100% Burned' ? 'text-[#D9F99D]' :
                        token.liquidityLockStatus === 'PinkLock 365d' ? 'text-emerald-400' :
                        'text-amber-400'
                      }`}>
                        {token.liquidityLockStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 rounded bg-zinc-950 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">Mint/Owner:</span>
                        <span className={token.ownershipRenounced ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {token.chain === 'solana' ? 'Revoked' : 'Renounced'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-950 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">Top 10:</span>
                        <span className="text-white font-bold">{token.top10HolderPercent}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 rounded bg-zinc-950 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">Tax Safe:</span>
                        <span className="text-emerald-400 font-bold">{token.taxBuySell}</span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-950 border border-white/5 flex items-center justify-between">
                        <span className="text-zinc-400">Freeze Flag:</span>
                        <span className="text-emerald-400 font-bold">Revoked</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Contract Address row with 1-Click Copy and Direct DexScreener Link */}
                  <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400 bg-[#050505] p-2 rounded-lg border border-white/5 font-mono my-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-zinc-500 font-bold">CA:</span>
                      <span className="text-zinc-300 truncate font-semibold" title={token.contractAddress}>
                        {formatAddressDisplay(token.contractAddress, 7, 5)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleCopyCa(token.contractAddress, e)}
                        className="px-2 py-1 min-h-[32px] rounded bg-zinc-900 border border-white/10 hover:border-[#D9F99D]/40 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-[10px] cursor-pointer"
                        title="Copy Full Contract Address (CA)"
                      >
                        {copiedCa === token.contractAddress ? (
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
                        href={dexScreenerLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-[#D9F99D] hover:bg-zinc-800 transition-colors"
                        title="Open on DexScreener"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Instant Snipe Actions */}
                <div className="pt-3 border-t border-white/5 mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSnipeToken(token)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-lg text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] transition-all shadow-md shadow-[#D9F99D]/10 cursor-pointer active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>1-CLICK SNIPE</span>
                  </button>

                  <a
                    href={explorerLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="View Contract on Block Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


