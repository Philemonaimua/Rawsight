import React, { useState } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  ShieldCheck, 
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Cpu,
  Layers
} from 'lucide-react';
import { Chain } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { getOrCreateAutonomousVaultKeys, fetchLiveVaultBalances } from '../lib/web3Service';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncLiveBalances?: () => void;
  vaultBalances?: {
    sol: number;
    bnb: number;
    eth: number;
    usdc: number;
    totalUsd: number;
  };
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSyncLiveBalances,
  vaultBalances,
}) => {
  const [selectedChain, setSelectedChain] = useState<Chain>('solana');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCheckingOnChain, setIsCheckingOnChain] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    verified: boolean;
    text: string;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const autoKeys = getOrCreateAutonomousVaultKeys();
  const targetAddress = selectedChain === 'solana' ? autoKeys.solanaAddress : autoKeys.evmAddress;
  const currentChainConfig = CHAINS_CONFIG[selectedChain];

  const handleCopyAddress = () => {
    if (!targetAddress) return;
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckOnChainSync = async () => {
    setIsCheckingOnChain(true);
    try {
      const res = await fetchLiveVaultBalances(autoKeys.solanaAddress, autoKeys.evmAddress);
      if (onSyncLiveBalances) {
        onSyncLiveBalances();
      }
      setSyncStatus({
        verified: true,
        text: `Confirmed on-chain balances: ${res.sol.toFixed(4)} SOL • ${res.bnb.toFixed(4)} BNB • ${res.eth.toFixed(4)} ETH (~$${res.totalUsd.toFixed(2)} USD).`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch {
      setSyncStatus({
        verified: false,
        text: 'Polled RPC nodes. Incoming transactions appear automatically once confirmed in validator blocks.',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsCheckingOnChain(false);
    }
  };

  const getExplorerUrl = () => {
    if (selectedChain === 'solana') {
      return `https://solscan.io/account/${targetAddress}`;
    }
    if (selectedChain === 'bnb') {
      return `https://bscscan.com/address/${targetAddress}`;
    }
    return `https://robinhoodchain.blockscout.com/address/${targetAddress}`;
  };

  const confirmedChainBalance = selectedChain === 'solana'
    ? `${vaultBalances?.sol.toFixed(4) || '0.0000'} SOL`
    : selectedChain === 'bnb'
    ? `${vaultBalances?.bnb.toFixed(4) || '0.0000'} BNB`
    : `${vaultBalances?.eth.toFixed(4) || '0.0000'} ETH`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
              <ArrowDownCircle className="w-4 h-4 text-[#D9F99D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Deposit On-Chain Liquidity
                </h2>
                <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MAINNET ONLY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Deposit funds directly on-chain. Top-ups require validator confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strict On-Chain Protocol Notice */}
        <div className="my-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Strict On-Chain Confirmation Rule</p>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Sandbox/simulated deposits are disabled. Capital is credited to your terminal reserve <strong>only when an on-chain transaction is verified by network RPC validators</strong>.
            </p>
          </div>
        </div>

        {/* Chain Selector */}
        <div className="space-y-4 my-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
              SELECT TARGET BLOCKCHAIN
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['solana', 'bnb', 'robinhood'] as Chain[]).map((chain) => {
                const chainConf = CHAINS_CONFIG[chain];
                return (
                  <button
                    key={chain}
                    type="button"
                    onClick={() => {
                      setSelectedChain(chain);
                      setSyncStatus(null);
                    }}
                    className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                      selectedChain === chain
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D]'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{chainConf.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{chainConf.nativeCoin}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target On-Chain Deposit Address Box */}
          <div className="p-4 bg-[#050505] border border-[#D9F99D]/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#D9F99D]" />
                Your Vault Deposit Address:
              </span>
              <span className="text-[#D9F99D] font-mono text-[11px] font-bold">
                {currentChainConfig.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetAddress}
                className="flex-1 bg-black/70 border border-white/10 rounded-md px-3 py-2 text-xs font-mono text-white select-all focus:outline-none focus:border-[#D9F99D]"
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-3.5 py-2 rounded-md bg-[#D9F99D] hover:bg-[#bef264] text-black transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
              <span className="text-zinc-400">Confirmed On-Chain Balance:</span>
              <span className="text-[#D9F99D] font-bold font-mono">
                {confirmedChainBalance}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
              <span>Send native {currentChainConfig.nativeCoin} from your external wallet or exchange.</span>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-[#D9F99D] hover:underline flex items-center gap-1 font-bold"
              >
                <span>View On Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Real-Time On-Chain Confirmation Checker */}
          <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#D9F99D]" />
                Helius + QuickNode On-Chain Verification
              </span>
              <button
                type="button"
                onClick={handleCheckOnChainSync}
                disabled={isCheckingOnChain}
                className="text-xs text-[#D9F99D] hover:underline flex items-center gap-1 cursor-pointer font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOnChain ? 'animate-spin' : ''}`} />
                <span>{isCheckingOnChain ? 'Querying Helius / QuickNode...' : 'Check Confirmation'}</span>
              </button>
            </div>

            {syncStatus ? (
              <div className="text-[11px] font-mono text-zinc-300 bg-black/40 p-2 rounded border border-white/5">
                <p>{syncStatus.text}</p>
                <p className="text-[9px] text-zinc-500 mt-1">Checked at {syncStatus.timestamp} • Automated trading primed</p>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                The terminal continuously polls Helius (Solana) & QuickNode (EVM) validator RPCs every second. Once your deposit confirms on-chain, liquidity syncs directly to the UI and triggers the automated trading engine.
              </p>
            )}
          </div>

          {/* Close Action */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Close Deposit Window
          </button>
        </div>
      </div>
    </div>
  );
};
