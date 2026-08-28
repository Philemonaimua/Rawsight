import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  Wallet, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Chain, LiveWalletState, TradingMode } from '../types';
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
  walletState: LiveWalletState;
  tradingMode?: TradingMode;
  onConfirmWithdraw: (amountUsd: number, chain: Chain, txHash?: string) => void;
  customRpcUrl?: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  walletState,
  tradingMode = 'SIMULATION_SANDBOX',
  onConfirmWithdraw,
  customRpcUrl,
}) => {
  const [selectedChain, setSelectedChain] = useState<Chain>('solana');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('50');
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

  // Set default recipient address when wallet is connected or chain switches
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      if (selectedChain === 'solana' && !walletState.address.startsWith('0x')) {
        setRecipientAddress(walletState.address);
      } else if (selectedChain !== 'solana' && walletState.address.startsWith('0x')) {
        setRecipientAddress(walletState.address);
      } else {
        setRecipientAddress('');
      }
    }
  }, [selectedChain, walletState.isConnected, walletState.address]);

  // Reset modal state on open
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

  // Conversion estimate to native token
  const nativeRate = selectedChain === 'solana' ? 185 : selectedChain === 'bnb' ? 580 : 2600;
  const nativeAmount = parsedAmount > 0 ? (parsedAmount / nativeRate) : 0;

  const handleMax = () => {
    const maxVal = Math.max(0, availableBalance);
    setAmountStr(maxVal.toFixed(2));
  };

  const handlePercentage = (pct: number) => {
    const val = (availableBalance * pct) / 100;
    setAmountStr(val.toFixed(2));
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExecuteWithdrawal = async () => {
    setError(null);
    if (parsedAmount < 1.0) {
      setError('Minimum withdrawal execution is $1.00 USD (or equivalent native token value).');
      return;
    }
    if (parsedAmount > availableBalance && availableBalance > 0) {
      setError(`Amount exceeds available unallocated reserve ($${availableBalance.toFixed(2)}).`);
      return;
    }
    if (!recipientAddress.trim()) {
      setError('Please enter a valid destination recipient address.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(tradingMode === 'LIVE_MAINNET' ? 'Initiating on-chain withdrawal...' : 'Processing sandbox withdrawal...');

    try {
      let result: { txHash: string; explorerUrl: string };

      if (tradingMode === 'LIVE_MAINNET') {
        if (selectedChain === 'solana') {
          setStatusMessage('Connecting to Solana Mainnet RPC & requesting signature...');
          result = await executeOnChainSolanaWithdrawal({
            recipientAddress: recipientAddress.trim(),
            amountSol: nativeAmount,
            customRpcUrl,
          });
        } else {
          setStatusMessage(`Switching to ${currentChainConfig.name} & prompting transaction signature...`);
          result = await executeOnChainEvmWithdrawal({
            chain: selectedChain,
            recipientAddress: recipientAddress.trim(),
            amount: nativeAmount,
          });
        }
      } else {
        // Sandbox bypass: simulate instantaneous local confirmation without throwing RPC gas errors
        await new Promise((resolve) => setTimeout(resolve, 800));
        const simHash = selectedChain === 'solana'
          ? `sim_sol_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
          : `0xsim_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 24)}`;
        result = {
          txHash: simHash,
          explorerUrl: getBlockExplorerTxUrl(selectedChain, simHash),
        };
      }

      setStatusMessage(tradingMode === 'LIVE_MAINNET' ? 'Transaction successfully confirmed on-chain!' : 'Sandbox withdrawal completed successfully!');
      setTxSuccess({
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        amount: parsedAmount,
        chain: selectedChain,
        recipient: recipientAddress.trim(),
      });

      onConfirmWithdraw(parsedAmount, selectedChain, result.txHash);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err?.message || 'Withdrawal failed. Check wallet connection or balance.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-amber-500/40 rounded-xl p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                On-Chain Multi-Chain Withdrawal
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                  Mainnet Direct
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Execute real on-chain native asset transfer to any external address.
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

        {/* Body content */}
        {!txSuccess ? (
          <div className="space-y-4 mt-4">
            {/* Chain Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">
                1. SELECT DESTINATION BLOCKCHAIN
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['solana', 'bnb', 'robinhood'] as Chain[]).map((c) => {
                  const isSelected = selectedChain === c;
                  const config = CHAINS_CONFIG[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedChain(c);
                        setError(null);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold shadow-sm'
                          : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{config.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Native: <span className="text-amber-400 font-semibold">{config.nativeCoin}</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-zinc-400" />
                        {c === 'robinhood' ? 'Chain ID 4663' : c === 'bnb' ? 'Chain ID 56' : 'Mainnet-Beta'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  2. DESTINATION RECIPIENT ADDRESS
                </label>
                {walletState.isConnected && walletState.address && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChain === 'solana') {
                        setRecipientAddress(walletState.vaultAddresses?.solana || walletState.address);
                      } else {
                        setRecipientAddress(walletState.vaultAddresses?.bnb || walletState.address);
                      }
                    }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Wallet className="w-3 h-3" />
                    Use Connected Address
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={selectedChain === 'solana' ? 'Solana public key (e.g. 7xK9...)' : '0x EVM address (e.g. 0x71C...)'}
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-[#050505] border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                  <span>3. WITHDRAWAL AMOUNT (USD)</span>
                  <span className="text-amber-400 font-mono text-[9px] px-1 py-0.2 rounded bg-amber-500/15">
                    $1.00 MIN
                  </span>
                </label>
                <div className="text-[10px] text-zinc-400">
                  Available Reserve: <span className="text-[#D9F99D] font-bold">${availableBalance.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="1.00"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-[#050505] border border-white/15 rounded-lg pl-7 pr-24 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 font-semibold">
                  ≈ {nativeAmount.toFixed(4)} {currentChainConfig.nativeCoin}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-2">
                <span>Minimum withdrawal is $1.00 USD</span>
                <span>Native rate: ~${nativeRate} USD/{currentChainConfig.nativeCoin}</span>
              </div>

              {/* Quick percentage buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentage(pct)}
                    className="min-h-[44px] flex items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  >
                    {pct === 100 ? 'MAX (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Status Progress */}
            {isProcessing && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>{statusMessage || 'Awaiting on-chain transaction execution...'}</span>
              </div>
            )}

            {/* Network & Gas Details */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-white/5 space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Target Chain & RPC:</span>
                <span className="text-white font-semibold">{currentChainConfig.name} (Mainnet)</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Network Gas:</span>
                <span className="text-emerald-400 font-semibold">{currentChainConfig.avgGas}</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Protocol:</span>
                <span className="text-zinc-300">
                  {selectedChain === 'solana' ? 'SystemProgram.transfer' : 'EIP-1559 Native Send'}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              id="btn-confirm-onchain-withdraw"
              onClick={handleExecuteWithdrawal}
              disabled={isProcessing || parsedAmount <= 0}
              className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-400 text-black hover:bg-amber-300 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Broadcasting To Mainnet...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>
                    Execute Real Withdrawal (${parsedAmount.toLocaleString()} USD)
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Success Screen */
          <div className="space-y-5 mt-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Withdrawal Broadcasted & Confirmed!
              </h3>
              <p className="text-xs text-zinc-300">
                Successfully transferred <span className="text-emerald-400 font-bold">${txSuccess.amount.toFixed(2)} USD</span> on {CHAINS_CONFIG[txSuccess.chain].name}.
              </p>
            </div>

            {/* Tx Details */}
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Destination Address:</span>
                <span className="text-white font-mono">
                  {txSuccess.recipient.slice(0, 8)}...{txSuccess.recipient.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Transaction Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-mono">
                    {txSuccess.txHash.slice(0, 10)}...{txSuccess.txHash.slice(-8)}
                  </span>
                  <button
                    onClick={() => handleCopyHash(txSuccess.txHash)}
                    className="p-1 text-zinc-400 hover:text-white rounded bg-zinc-900 border border-white/10"
                    title="Copy Transaction Hash"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Block Explorer Button */}
            <a
              id="link-view-explorer-tx"
              href={txSuccess.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-amber-400/50 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Verify on Block Explorer ({CHAINS_CONFIG[txSuccess.chain].name})</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
