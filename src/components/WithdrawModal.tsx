import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Chain } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { 
  executeOnChainSolanaWithdrawal, 
  executeOnChainEvmWithdrawal,
  getBlockExplorerTxUrl
} from '../lib/web3Service';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  vaultBalances?: {
    sol: number;
    bnb: number;
    eth: number;
    usdc: number;
    totalUsd: number;
  };
  onConfirmWithdraw: (amountUsd: number, chain: Chain, txHash?: string) => void;
  customRpcUrl?: Record<Chain, string>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  vaultBalances,
  onConfirmWithdraw,
  customRpcUrl,
}) => {
  const [selectedChain, setSelectedChain] = useState<Chain>('solana');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<{
    txHash: string;
    explorerUrl: string;
    amount: number;
    chain: Chain;
    recipient: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTxSuccess(null);
      setStatusMessage('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentChainConfig = CHAINS_CONFIG[selectedChain];
  const parsedAmount = parseFloat(amountStr) || 0;
  const nativeRate = selectedChain === 'solana' ? 185 : selectedChain === 'bnb' ? 580 : 2600;
  const nativeAmount = parsedAmount > 0 ? (parsedAmount / nativeRate) : 0;

  const onChainBalanceNative = selectedChain === 'solana'
    ? (vaultBalances?.sol || 0)
    : selectedChain === 'bnb'
    ? (vaultBalances?.bnb || 0)
    : (vaultBalances?.eth || 0);

  const onChainBalanceUsd = onChainBalanceNative * nativeRate;

  const handleMax = () => {
    const maxVal = Math.max(0, Math.min(availableBalance, onChainBalanceUsd));
    setAmountStr(maxVal.toFixed(2));
  };

  const handlePercentage = (pct: number) => {
    const base = Math.min(availableBalance, onChainBalanceUsd);
    const val = (base * pct) / 100;
    setAmountStr(val.toFixed(2));
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExecuteWithdrawal = async () => {
    setError(null);
    if (!recipientAddress.trim()) {
      setError('Please enter a destination recipient wallet address.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Please enter an amount greater than $0.');
      return;
    }

    if (onChainBalanceNative <= 0 || nativeAmount > onChainBalanceNative) {
      setError(
        `Insufficient confirmed on-chain balance on ${currentChainConfig.name}. Your vault holds ${onChainBalanceNative.toFixed(4)} ${currentChainConfig.nativeCoin} (~$${onChainBalanceUsd.toFixed(2)} USD).`
      );
      return;
    }

    if (selectedChain === 'solana' && (recipientAddress.length < 32 || recipientAddress.length > 44)) {
      setError('Invalid Solana recipient address format. Must be a valid Base58 public key.');
      return;
    }

    if (selectedChain !== 'solana' && (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42)) {
      setError('Invalid EVM (0x...) recipient address format.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Initiating on-chain cryptographic withdrawal...');

    try {
      let txResult: { success: boolean; signature?: string; txHash?: string; error?: string };

      if (selectedChain === 'solana') {
        setStatusMessage(`Signing and broadcasting on Solana Mainnet for ${nativeAmount.toFixed(4)} SOL...`);
        const rpc = customRpcUrl?.solana;
        txResult = await executeOnChainSolanaWithdrawal(recipientAddress.trim(), nativeAmount, rpc);
      } else {
        setStatusMessage(`Signing and broadcasting on ${currentChainConfig.name} for ${nativeAmount.toFixed(4)} ${currentChainConfig.nativeCoin}...`);
        const rpc = selectedChain === 'bnb' ? customRpcUrl?.bnb : customRpcUrl?.robinhood;
        txResult = await executeOnChainEvmWithdrawal(selectedChain, recipientAddress.trim(), nativeAmount, rpc);
      }

      const hash = txResult.signature || txResult.txHash;
      if (txResult.success && hash) {
        const explorerUrl = getBlockExplorerTxUrl(selectedChain, hash);
        setTxSuccess({
          txHash: hash,
          explorerUrl,
          amount: parsedAmount,
          chain: selectedChain,
          recipient: recipientAddress.trim(),
        });
        onConfirmWithdraw(parsedAmount, selectedChain, hash);
      } else {
        throw new Error(txResult.error || 'Transaction rejected by on-chain validator network.');
      }
    } catch (err: any) {
      setError(err?.message || 'Withdrawal encountered an on-chain error.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
              <ArrowUpRight className="w-4 h-4 text-[#D9F99D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Withdraw On-Chain Liquidity
                </h2>
                <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ON-CHAIN MAINNET
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Transfer verified liquidity directly to your external destination wallet.
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

        {/* Success View */}
        {txSuccess ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#D9F99D]/10 border border-[#D9F99D]/40 flex items-center justify-center mx-auto text-[#D9F99D]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Withdrawal Broadcast Confirmed</h3>
              <p className="text-xs text-zinc-400 mt-1">
                ${txSuccess.amount.toFixed(2)} USD transferred to {txSuccess.recipient.slice(0, 6)}...{txSuccess.recipient.slice(-4)}
              </p>
            </div>

            <div className="p-3 bg-black/60 border border-white/10 rounded-lg text-left space-y-1.5 text-xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Transaction Hash:</span>
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-zinc-300">
                <span className="truncate">{txSuccess.txHash}</span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(txSuccess.txHash)}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[#D9F99D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {txSuccess.explorerUrl !== '#' && (
              <a
                href={txSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#D9F99D] hover:underline font-bold"
              >
                <span>View On Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded bg-[#D9F99D] text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Execution Form */
          <div className="space-y-4 my-4">
            {/* Chain Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                WITHDRAW FROM CHAIN
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
                        setError(null);
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

            {/* Confirmed On-Chain Balance Info */}
            <div className="p-3 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Confirmed {currentChainConfig.name} Balance:</span>
              <span className="text-[#D9F99D] font-bold font-mono">
                {onChainBalanceNative.toFixed(4)} {currentChainConfig.nativeCoin} (~${onChainBalanceUsd.toFixed(2)} USD)
              </span>
            </div>

            {/* Destination Recipient Address */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
                DESTINATION RECIPIENT ADDRESS ({selectedChain === 'solana' ? 'Solana Base58' : 'EVM 0x...'})
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={selectedChain === 'solana' ? 'e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' : 'e.g. 0x71C...'}
                className="w-full bg-[#050505] border border-white/10 rounded-md py-2.5 px-3 text-white text-xs font-mono focus:outline-none focus:border-[#D9F99D] transition-colors"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px]">
                <span className="uppercase tracking-widest text-zinc-400">WITHDRAWAL AMOUNT (USD)</span>
                <span className="text-zinc-300">
                  Max On-Chain: <strong className="text-white">${onChainBalanceUsd.toFixed(2)}</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/10 rounded-md py-2.5 pl-8 pr-4 text-white text-sm focus:outline-none focus:border-[#D9F99D] transition-colors"
                />
              </div>

              {/* Quick Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => pct === 100 ? handleMax() : handlePercentage(pct)}
                    className="py-1 rounded bg-[#050505] border border-white/10 hover:border-[#D9F99D]/40 text-zinc-300 text-[11px] font-bold cursor-pointer"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>

              {parsedAmount > 0 && (
                <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Estimated Net Payout:</span>
                  <span className="text-[#D9F99D] font-mono font-bold">
                    ≈ {nativeAmount.toFixed(4)} {currentChainConfig.nativeCoin}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Feedback */}
            {statusMessage && (
              <div className="p-3 bg-[#D9F99D]/10 border border-[#D9F99D]/30 rounded text-[#D9F99D] text-xs flex items-center gap-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleExecuteWithdrawal}
              disabled={isProcessing || parsedAmount <= 0 || onChainBalanceNative <= 0}
              className="w-full py-3 rounded-md bg-[#D9F99D] hover:bg-[#bef264] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Broadcasting On-Chain...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Broadcast ${parsedAmount.toFixed(2)} Withdrawal</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
