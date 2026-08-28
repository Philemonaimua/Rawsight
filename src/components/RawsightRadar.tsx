import React, { useState } from 'react';
import { 
  Radar, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  Lock,
  Users,
  Search,
  Check,
  Loader2,
  Copy,
  BarChart2
} from 'lucide-react';
import { MemeToken, Chain } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { inspectLiveContractAddress } from '../lib/dexScreener';
import { formatAddressDisplay, getDexScreenerUrl, getExplorerTokenUrl } from '../lib/caParser';
import { formatMarketCap, formatLiquidity, formatTokenPrice } from '../lib/formatters';

interface RawsightRadarProps {
  tokens: MemeToken[];
  onTriggerManualScan: () => void;
  onSnipeToken: (token: MemeToken) => void;
  isScanning: boolean;
  onAddCustomToken?: (token: MemeToken) => void;
}

export const RawsightRadar: React.FC<RawsightRadarProps> = ({
  tokens,
  onTriggerManualScan,
  onSnipeToken,
  isScanning,
  onAddCustomToken,
}) => {
  const [selectedChainFilter, setSelectedChainFilter] = useState<Chain | 'all'>('all');
  const [contractQuery, setContractQuery] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [copiedCa, setCopiedCa] = useState<string | null>(null);

  const handleCopyCa = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCa(ca);
    setTimeout(() => setCopiedCa(null), 1800);
  };

  const filteredTokens = selectedChainFilter === 'all' 
    ? tokens 
    : tokens.filter(t => t.chain === selectedChainFilter);

  const handleInspectContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractQuery.trim()) return;

    setIsInspecting(true);
    setInspectError(null);

    try {
      const inspected = await inspectLiveContractAddress(contractQuery.trim());
      if (inspected) {
        if (onAddCustomToken) {
          onAddCustomToken(inspected);
        }
        setContractQuery('');
      } else {
        setInspectError('No active liquidity pair found on DexScreener/Raydium for this contract address.');
      }
    } catch {
      setInspectError('Failed to inspect contract address.');
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-4 sm:p-5 mb-6 font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-md bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D] shrink-0">
            <Radar className={`w-4 h-4 text-[#D9F99D] ${isScanning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Rawsight Multi-Chain Scrutiny Radar
              </h2>
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9F99D] animate-ping" />
                LIVE ON-CHAIN STREAM
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Scans Solana, BNB Chain, and Robinhood Chain. Rejects insider clusters, fake locks, and low LP pools.
            </p>
          </div>
        </div>

        {/* Chain Filters and Scan Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#050505] p-1 rounded-md border border-white/10 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedChainFilter('all')}
              className={`px-3 py-1.5 min-h-[44px] rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                selectedChainFilter === 'all' 
                  ? 'bg-[#D9F99D] text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Chains
            </button>
            <button
              onClick={() => setSelectedChainFilter('solana')}
              className={`px-3 py-1.5 min-h-[44px] rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                selectedChainFilter === 'solana' 
                  ? 'bg-[#D9F99D] text-black' 
                  : 'text-zinc-400 hover:text-[#D9F99D]'
              }`}
            >
              Solana
            </button>
            <button
              onClick={() => setSelectedChainFilter('bnb')}
              className={`px-3 py-1.5 min-h-[44px] rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                selectedChainFilter === 'bnb' 
                  ? 'bg-amber-400 text-black' 
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              BNB Chain
            </button>
            <button
              onClick={() => setSelectedChainFilter('robinhood')}
              className={`px-3 py-1.5 min-h-[44px] rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                selectedChainFilter === 'robinhood' 
                  ? 'bg-[#D9F99D] text-black' 
                  : 'text-zinc-400 hover:text-[#D9F99D]'
              }`}
            >
              Robinhood
            </button>
          </div>

          <button
            id="btn-trigger-scan"
            onClick={onTriggerManualScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider border border-[#D9F99D]/30 bg-[#0A0A0A] text-[#D9F99D] hover:bg-[#D9F99D]/10 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Syncing...' : 'Sync Live Pairs'}</span>
          </button>
        </div>
      </div>

      {/* Live Contract Address Immediate Inspector */}
      <div className="my-3">
        <form onSubmit={handleInspectContract} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={contractQuery}
              onChange={(e) => setContractQuery(e.target.value)}
              placeholder="Paste any live Solana Mint (e.g. WIF, BONK) or BNB / Robinhood Token CA to audit & snipe..."
              className="w-full bg-[#050505] border border-white/10 rounded-md pl-9 pr-3 py-2.5 min-h-[44px] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9F99D]/60"
            />
          </div>
          <button
            type="submit"
            disabled={isInspecting || !contractQuery.trim()}
            className="px-4 py-2.5 min-h-[44px] bg-[#D9F99D]/10 border border-[#D9F99D]/40 text-[#D9F99D] font-bold uppercase text-xs rounded-md hover:bg-[#D9F99D] hover:text-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {isInspecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Audit & Add CA</span>
              </>
            )}
          </button>
        </form>
        {inspectError && (
          <p className="mt-1.5 text-xs text-red-400 font-mono">
            {inspectError}
          </p>
        )}
      </div>

      {/* Scrutiny Rules Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 p-2.5 rounded-lg bg-[#050505] border border-white/5 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D9F99D]" />
          <span>LP Lock: <strong className="text-zinc-200">≥ 90%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#D9F99D]" />
          <span>Top 10: <strong className="text-zinc-200">&lt; 15%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#D9F99D]" />
          <span>Mint Authority: <strong className="text-[#D9F99D]">Renounced</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Smart Money: <strong className="text-amber-300">Score &gt; 80</strong></span>
        </div>
      </div>

      {/* Radar Tokens List */}
      <div className="space-y-3 mt-4">
        {filteredTokens.map((token) => {
          const chainConfig = CHAINS_CONFIG[token.chain];
          const isPassed = token.scrutinyStatus === 'PASSED_RAWSIGHT';
          const dexScreenerUrl = getDexScreenerUrl(token.chain, token.contractAddress);
          const explorerUrl = getExplorerTokenUrl(token.chain, token.contractAddress);

          return (
            <div
              key={token.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isPassed 
                  ? 'bg-[#050505] border-[#D9F99D]/20 hover:border-[#D9F99D]/40' 
                  : 'bg-[#050505] border-red-900/30 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Token info & Chain */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                    isPassed 
                      ? 'bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30' 
                      : 'bg-red-950/40 text-red-400 border border-red-500/20'
                  }`}>
                    {token.symbol.replace('$', '').slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {token.symbol}
                      </span>

                      {/* Explicit Contract Address beside token */}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0A0A0A] border border-white/10 hover:border-[#D9F99D]/40 transition-colors">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">CA:</span>
                        <span className="text-[10px] text-zinc-300 font-mono" title={token.contractAddress}>
                          {formatAddressDisplay(token.contractAddress, 6, 4)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCa(token.contractAddress, e)}
                          className="text-zinc-400 hover:text-[#D9F99D] p-1 transition-colors cursor-pointer"
                          title="Copy Full Contract Address"
                        >
                          {copiedCa === token.contractAddress ? (
                            <Check className="w-3 h-3 text-[#D9F99D]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        
                        <a
                          href={dexScreenerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-[#D9F99D] p-1 transition-colors"
                          title="Open on DexScreener"
                        >
                          <BarChart2 className="w-3 h-3" />
                        </a>

                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-[#D9F99D] p-1 transition-colors"
                          title={`View on ${chainConfig?.name || 'Block'} Explorer`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <span className="px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider border border-[#D9F99D]/30 bg-[#D9F99D]/10 text-[#D9F99D]">
                        {chainConfig?.name || token.chain}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatTokenPrice(token.currentPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {token.name} • <span className="text-zinc-300 font-semibold">MC: {formatMarketCap(token.mcap)}</span> • <span>LP: {formatLiquidity(token.liquidityUsd)}</span>
                    </p>
                  </div>
                </div>

                {/* Middle: Badges & Scrutiny status */}
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-wider">
                  {isPassed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/40">
                      <CheckCircle className="w-3 h-3 text-[#D9F99D]" />
                      RAWSIGHT ALPHA PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold bg-red-950/60 text-red-300 border border-red-500/40">
                      <XCircle className="w-3 h-3 text-red-400" />
                      FILTER REJECTED
                    </span>
                  )}

                  <span className="px-1.5 py-0.5 rounded-sm bg-[#0A0A0A] text-zinc-300 border border-white/10">
                    LP: {token.lpLockedPercent}% locked
                  </span>

                  <span className="px-1.5 py-0.5 rounded-sm bg-[#0A0A0A] text-zinc-300 border border-white/10">
                    Top 10: {token.top10HolderPercent}%
                  </span>

                  <span className={`px-1.5 py-0.5 rounded-sm border ${
                    token.rugRiskScore <= 15 
                      ? 'bg-[#0A0A0A] text-[#D9F99D] border-[#D9F99D]/30' 
                      : 'bg-red-950/40 text-red-400 border-red-500/30'
                  }`}>
                    Rug Risk: {token.rugRiskScore}/100
                  </span>
                </div>

                {/* Right: Action / Snipe button */}
                <div className="flex items-center gap-2 self-stretch sm:self-end md:self-center">
                  {isPassed ? (
                    <button
                      id={`btn-snipe-${token.id}`}
                      onClick={() => onSnipeToken(token)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-md text-xs font-bold uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-black fill-black" />
                      <span>Snipe Now</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-red-400/90 italic">
                      {token.auditFailureReason || 'Failed Safety Scrutiny'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
