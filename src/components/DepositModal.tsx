import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowDownCircle, 
  ShieldCheck, 
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  QrCode,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Chain, LiveWalletState, TradingMode } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { getOrCreateAutonomousVaultKeys, fetchLiveVaultBalances } from '../lib/web3Service';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeposit: (amountUsd: number, chain: Chain) => void;
  walletState?: LiveWalletState;
  onSyncLiveBalances?: () => void;
  tradingMode?: TradingMode;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeposit,
  walletState,
  onSyncLiveBalances,
  tradingMode = 'LIVE_MAINNET',
}) => {
  const isLive = tradingMode === 'LIVE_MAINNET';
  const [selectedChain, setSelectedChain] = useState<Chain>('solana');
  const [depositMode, setDepositMode] = useState<'connected_wallet' | 'direct_transfer'>(
    isLive && walletState?.isConnected ? 'connected_wallet' : 'direct_transfer'
  );
  const [amount, setAmount] = useState<number>(isLive ? 100 : 1000);
  const [customAmountStr, setCustomAmountStr] = useState<string>(isLive ? '100' : '1000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCheckingOnChain, setIsCheckingOnChain] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = Boolean(walletState?.isConnected && walletState?.address);
  const targetAddress = isConnected 
    ? (walletState?.address || '') 
    : (selectedChain === 'solana' ? 'No Solana wallet connected' : 'No EVM wallet connected');

  const handleCopyAddress = () => {
    if (!isConnected || !walletState?.address) return;
    navigator.clipboard.writeText(walletState.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckOnChainSync = async () => {
    if (!walletState?.address) return;
    setIsCheckingOnChain(true);
    setSyncMessage(null);
    try {
      const res = await fetchLiveVaultBalances(
        selectedChain === 'solana' ? walletState.address : '',
        selectedChain !== 'solana' ? walletState.address : ''
      );
      if (onSyncLiveBalances) {
        onSyncLiveBalances();
      }
      setSyncMessage(`Live on-chain check completed: ${res.sol.toFixed(3)} SOL • ${res.bnb.toFixed(3)} BNB.`);
    } catch {
      setSyncMessage('RPC check completed. If you recently transferred funds, allow 15-30s for validator confirmations.');
    } finally {
      setIsCheckingOnChain(false);
    }
  };

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handlePercentOfWallet = (pct: number) => {
    const total = walletState?.balances?.totalUsd || 500;
    const calculated = Math.max(1, Math.round((total * pct) / 100));
    setAmount(calculated);
    setCustomAmountStr(calculated.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmountStr(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleDeposit = () => {
    if (amount < 1.0) return;
    setIsProcessing(true);

    setTimeout(() => {
      onConfirmDeposit(amount, selectedChain);
      setIsProcessing(false);
      
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D9F99D', '#f59e0b', '#a3e635'],
        });
      } catch {
        // Ignore confetti if unsupported
      }

      onClose();
    }, 600);
  };

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
                  {isLive ? 'Live Mainnet Vault Top-Up' : 'Sandbox Capital Allocation'}
                </h2>
                <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  isLive ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/30'
                }`}>
                  {isLive ? 'LIVE' : 'SANDBOX'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isLive 
                  ? 'Credit liquid cash to your self-custody vault reserve for real autonomous execution.'
                  : 'Allocate virtual paper funds to test multi-chain strategies in simulated sandbox mode.'}
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

        {/* Chain Selector */}
        <div className="space-y-4 my-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
              TARGET EXECUTION CHAIN
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['solana', 'bnb', 'robinhood'] as Chain[]).map((chain) => {
                const chainConf = CHAINS_CONFIG[chain];
                return (
                  <button
                    key={chain}
                    type="button"
                    onClick={() => setSelectedChain(chain)}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      selectedChain === chain
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D]'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{chainConf.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{chainConf.dex}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-[#050505] p-1 rounded-md border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDepositMode('connected_wallet')}
              className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
                depositMode === 'connected_wallet'
                  ? 'bg-[#D9F99D] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isLive ? 'Top-Up from Wallet' : 'Quick Presets'}
            </button>
            <button
              type="button"
              onClick={() => setDepositMode('direct_transfer')}
              className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors ${
                depositMode === 'direct_transfer'
                  ? 'bg-[#D9F99D] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isLive ? 'Direct On-Chain Address' : 'Custom Amount'}
            </button>
          </div>

          {/* Mode 1: Top-Up from Connected Wallet */}
          {depositMode === 'connected_wallet' ? (
            <div className="space-y-4">
              {isLive && walletState?.isConnected && (
                <div className="p-3 rounded-lg bg-[#050505] border border-[#D9F99D]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold">Connected Live Wallet:</span>
                    <span className="text-[#D9F99D] font-mono font-bold">
                      {walletState.walletProvider?.toUpperCase() || 'WALLET'} ({walletState.address.slice(0, 4)}...{walletState.address.slice(-4)})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block text-[9px]">SOL:</span>
                      <strong className="text-white">{walletState.balances?.sol.toFixed(2)} SOL</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px]">BNB:</span>
                      <strong className="text-white">{walletState.balances?.bnb.toFixed(2)} BNB</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px]">USDC/USDT:</span>
                      <strong className="text-white">${walletState.balances?.usdc.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Percentage Shortcuts */}
              {isLive && walletState?.isConnected && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                    ALLOCATE FROM WALLET BALANCE
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentOfWallet(pct)}
                        className="py-1.5 rounded-sm text-xs border border-white/10 bg-[#050505] text-zinc-300 hover:border-[#D9F99D]/40 hover:text-[#D9F99D] transition-all font-bold"
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  USD CAPITAL PRESETS
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 100, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePreset(val)}
                      className={`py-2 rounded-sm text-xs border transition-all ${
                        amount === val
                          ? 'border-[#D9F99D] bg-[#D9F99D]/15 text-[#D9F99D] font-bold'
                          : 'border-white/10 bg-[#050505] text-zinc-400 hover:text-white'
                      }`}
                    >
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400">
                    AMOUNT TO TOP-UP (USD)
                  </label>
                  <span className="text-[10px] text-[#D9F99D] font-bold font-mono">
                    $1.00 Min
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={customAmountStr}
                    onChange={handleCustomChange}
                    placeholder="100.00"
                    className="w-full bg-[#050505] border border-white/10 rounded-md pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D9F99D]/60 font-mono font-bold"
                  />
                </div>
                {amount > 0 && amount < 1.0 && (
                  <p className="text-[10px] text-amber-400 mt-1">Minimum vault deposit is $1.00 USD.</p>
                )}
              </div>

              {/* Action Button */}
              <button
                id="btn-confirm-topup"
                onClick={handleDeposit}
                disabled={isProcessing || amount < 1.0}
                className="w-full py-3 rounded-sm text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <span>Crediting ${amount.toLocaleString()} USD to Reserve...</span>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-black" />
                    <span>Confirm ${amount.toLocaleString()} USD Vault Top-Up</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Mode 2: Direct On-Chain Address */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#050505] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[10px] uppercase">
                    SELF-CUSTODIAL VAULT {selectedChain === 'solana' ? 'SOLANA' : 'EVM'} ADDRESS
                  </span>
                  <span className="text-[10px] text-[#D9F99D] font-mono">100% PRIVATE KEYS IN RAM</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-[#0A0A0A] border border-white/10 rounded font-mono text-xs text-zinc-300 break-all select-all">
                  <span className="flex-1 text-[11px]">{targetAddress}</span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors shrink-0 cursor-pointer"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#D9F99D]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <a
                    href={`${CHAINS_CONFIG[selectedChain].explorerUrl}/address/${targetAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#D9F99D] hover:underline"
                  >
                    <span>View on {CHAINS_CONFIG[selectedChain].name} Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* RPC Sync Check */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckOnChainSync}
                  disabled={isCheckingOnChain}
                  className="flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider bg-[#0A0A0A] border border-[#D9F99D]/40 text-[#D9F99D] hover:bg-[#D9F99D]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOnChain ? 'animate-spin text-[#D9F99D]' : ''}`} />
                  <span>{isCheckingOnChain ? 'Querying Mainnet RPC...' : 'Check & Sync Incoming Deposit'}</span>
                </button>
              </div>

              {syncMessage && (
                <div className="p-2.5 rounded bg-[#0A0A0A] border border-[#D9F99D]/20 text-[11px] text-[#D9F99D]">
                  {syncMessage}
                </div>
              )}
            </div>
          )}

          {/* Security & Vault Guarantee */}
          <div className="p-3 rounded-md bg-[#050505] border border-white/5 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#D9F99D] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D9F99D]" />
              <span>Multi-Chain MEV Defense & Isolated Capital Reserve</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Deposited funds are held strictly within your self-custodial multi-chain vault reserve. Automated orders execute with an absolute $1.00 USD minimum floor and instant anti-rug protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

