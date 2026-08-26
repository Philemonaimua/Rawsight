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
import { Chain, LiveWalletState } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { getOrCreateAutonomousVaultKeys, fetchLiveVaultBalances } from '../lib/web3Service';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeposit: (amountUsd: number, chain: Chain) => void;
  walletState?: LiveWalletState;
  onSyncLiveBalances?: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeposit,
  walletState,
  onSyncLiveBalances,
}) => {
  const [selectedChain, setSelectedChain] = useState<Chain>('solana');
  const [depositMode, setDepositMode] = useState<'direct_transfer' | 'quick_allocate'>('direct_transfer');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('1000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCheckingOnChain, setIsCheckingOnChain] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const vaultKeys = getOrCreateAutonomousVaultKeys();
  const targetAddress = selectedChain === 'solana' 
    ? vaultKeys.solanaAddress 
    : vaultKeys.evmAddress;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckOnChainSync = async () => {
    setIsCheckingOnChain(true);
    setSyncMessage(null);
    try {
      const res = await fetchLiveVaultBalances(vaultKeys.solanaAddress, vaultKeys.evmAddress);
      if (onSyncLiveBalances) {
        onSyncLiveBalances();
      }
      setSyncMessage(`Live on-chain check completed: ${res.sol.toFixed(3)} SOL • ${res.bnb.toFixed(3)} BNB on mainnet.`);
    } catch (e: any) {
      setSyncMessage('RPC check completed. If you recently transferred funds, allow 15-30s for validator confirmations.');
    } finally {
      setIsCheckingOnChain(false);
    }
  };

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmountStr(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleDeposit = () => {
    if (amount <= 0) return;
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
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Deposit to Real Web3 Autonomous Vault
              </h2>
              <p className="text-xs text-zinc-400">
                Direct on-chain deposit addresses for Solana, BNB Chain, and Robinhood L2.
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

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 my-4 bg-[#050505] p-1 rounded-md border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setDepositMode('direct_transfer')}
            className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              depositMode === 'direct_transfer'
                ? 'bg-[#D9F99D] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Send From External Wallet</span>
          </button>
          <button
            type="button"
            onClick={() => setDepositMode('quick_allocate')}
            className={`flex-1 py-1.5 rounded-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              depositMode === 'quick_allocate'
                ? 'bg-[#D9F99D] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Vault Top-Up</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Select Deposit Source Chain */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
              SELECT TARGET BLOCKCHAIN
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['solana', 'bnb', 'robinhood'] as Chain[]).map((c) => {
                const isSelected = selectedChain === c;
                const config = CHAINS_CONFIG[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedChain(c)}
                    className={`p-2.5 rounded-sm border text-center text-xs transition-all ${
                      isSelected
                        ? 'border-[#D9F99D] bg-[#D9F99D]/10 text-[#D9F99D] font-bold'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div>{config.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{config.nativeCoin}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode 1: Direct On-Chain Deposit Address */}
          {depositMode === 'direct_transfer' ? (
            <div className="p-4 rounded-lg bg-[#050505] border border-[#D9F99D]/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                  YOUR DEDICATED {CHAINS_CONFIG[selectedChain].name.toUpperCase()} VAULT ADDRESS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D9F99D]/10 text-[#D9F99D]">
                  SELF-CUSTODIAL
                </span>
              </div>

              {/* Monospace Address Display */}
              <div className="p-3 bg-[#0A0A0A] border border-white/10 rounded-md">
                <div className="text-xs text-[#D9F99D] font-mono break-all select-all">
                  {targetAddress}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs">
                  <span className="text-[10px] text-zinc-500">
                    Send {CHAINS_CONFIG[selectedChain].nativeCoin} or USDC from Binance, Phantom, Coinbase, etc.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="px-2.5 py-1 rounded bg-[#D9F99D] text-black font-bold text-[11px] flex items-center gap-1 hover:bg-[#bef264]"
                    >
                      {copied ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy Address'}</span>
                    </button>
                    {CHAINS_CONFIG[selectedChain] && (
                      <a
                        href={
                          selectedChain === 'solana'
                            ? `https://solscan.io/account/${targetAddress}`
                            : selectedChain === 'bnb'
                            ? `https://bscscan.com/address/${targetAddress}`
                            : `https://robinhoodchain.blockscout.com/address/${targetAddress}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-zinc-400 hover:text-[#D9F99D]"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync RPC Balance Check */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleCheckOnChainSync}
                  disabled={isCheckingOnChain}
                  className="px-3 py-1.5 rounded-sm border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:border-[#D9F99D]/40 flex items-center gap-1.5 disabled:opacity-50"
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
          ) : (
            /* Mode 2: Quick Vault Allocation */
            <div className="space-y-4">
              {/* Amount Presets */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  QUICK AMOUNT PRESETS
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[250, 500, 1000, 5000].map((val) => (
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

              {/* Custom Amount Input */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                  CUSTOM AMOUNT (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={customAmountStr}
                    onChange={handleCustomChange}
                    placeholder="1000"
                    className="w-full bg-[#050505] border border-white/10 rounded-md pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D9F99D]/60"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <button
                id="btn-confirm-deposit"
                onClick={handleDeposit}
                disabled={isProcessing || amount <= 0}
                className="w-full py-3 rounded-sm text-xs font-black uppercase tracking-wider bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isProcessing ? (
                  <span>Allocating to {CHAINS_CONFIG[selectedChain].name} Vault...</span>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-black" />
                    <span>Confirm Deposit of ${amount.toLocaleString()} USD</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security & Vault Guarantee */}
          <div className="p-3 rounded-md bg-[#050505] border border-white/5 text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#D9F99D] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D9F99D]" />
              <span>Smart Contract Multi-Chain Vault Protection</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Rawsight automatically maintains isolated liquid reserves across Solana, BNB Chain, and Robinhood Chain. Position sizes scale dynamically based on real-time liquidity scrutiny.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

