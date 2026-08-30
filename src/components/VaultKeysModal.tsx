import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  Lock, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { AutonomousVaultKeys, getBlockExplorerTxUrl } from '../lib/web3Service';

interface VaultKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultKeys: AutonomousVaultKeys;
  onRefreshBalances?: () => void;
}

export const VaultKeysModal: React.FC<VaultKeysModalProps> = ({
  isOpen,
  onClose,
  vaultKeys,
  onRefreshBalances,
}) => {
  const [showSolanaSecret, setShowSolanaSecret] = useState(false);
  const [showEvmSecret, setShowEvmSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#D9F99D]/40 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9F99D]/10 border border-[#D9F99D]/30 flex items-center justify-center text-[#D9F99D]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  Autonomous Vault Keypairs
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  PIN Synced
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Deterministic non-custodial multi-chain keys synchronized to your Master PIN.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Info Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-[#D9F99D]/20 flex items-start gap-3 text-xs text-zinc-300">
          <Sparkles className="w-4 h-4 text-[#D9F99D] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#D9F99D] uppercase tracking-wider block text-[11px]">
              Deterministic Zero-Knowledge Derivation
            </span>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Whenever you log in and verify your Master PIN, the exact same Solana Mainnet and EVM (BNB Smart Chain & Robinhood Chain) public and private keys are recovered automatically. Private keys remain secure and sign transactions directly on-device.
            </p>
          </div>
        </div>

        {/* Key Card 1: Solana Mainnet */}
        <div className="p-4 rounded-xl bg-[#050505] border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Solana Mainnet Keypair
              </h3>
            </div>
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              SVM (Raydium / Jupiter / Pump.fun)
            </span>
          </div>

          {/* Solana Public Key */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
              <span>Public Address (Deposit Address)</span>
              <a
                href={`https://solscan.io/account/${vaultKeys.solanaAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline flex items-center gap-1 text-[10px]"
              >
                <span>View Solscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={vaultKeys.solanaAddress}
                className="flex-1 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white select-all focus:outline-none focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => handleCopy(vaultKeys.solanaAddress, 'sol-pub')}
                className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-purple-500/30"
              >
                {copiedKey === 'sol-pub' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sol-pub' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Solana Private Key */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
              <span>Solana Private / Secret Key (Base58)</span>
              <span className="text-red-400 text-[10px] font-bold">NEVER SHARE</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showSolanaSecret ? 'text' : 'password'}
                readOnly
                value={vaultKeys.solanaSecretKey}
                className="flex-1 bg-black/80 border border-red-500/20 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 select-all focus:outline-none focus:border-red-400"
              />
              <button
                type="button"
                onClick={() => setShowSolanaSecret(!showSolanaSecret)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer border border-white/10"
                title={showSolanaSecret ? 'Hide private key' : 'Show private key'}
              >
                {showSolanaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(vaultKeys.solanaSecretKey, 'sol-sec')}
                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-red-500/30"
              >
                {copiedKey === 'sol-sec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sol-sec' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Card 2: EVM Mainnets (BNB Smart Chain & Robinhood Chain) */}
        <div className="p-4 rounded-xl bg-[#050505] border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                EVM Mainnet Keypair
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                BNB Chain (56)
              </span>
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Robinhood (4663)
              </span>
            </div>
          </div>

          {/* EVM Public Address */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
              <span>EVM Public Address (Deposit BNB & Robinhood ETH)</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://bscscan.com/address/${vaultKeys.evmAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  <span>BscScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-zinc-600">•</span>
                <a
                  href={`https://robinhoodchain.blockscout.com/address/${vaultKeys.evmAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  <span>Robinhood Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={vaultKeys.evmAddress}
                className="flex-1 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white select-all focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => handleCopy(vaultKeys.evmAddress, 'evm-pub')}
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
              >
                {copiedKey === 'evm-pub' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'evm-pub' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* EVM Private Key */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
              <span>EVM Private Key (Hex 0x...)</span>
              <span className="text-red-400 text-[10px] font-bold">NEVER SHARE</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showEvmSecret ? 'text' : 'password'}
                readOnly
                value={vaultKeys.evmPrivateKey}
                className="flex-1 bg-black/80 border border-red-500/20 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 select-all focus:outline-none focus:border-red-400"
              />
              <button
                type="button"
                onClick={() => setShowEvmSecret(!showEvmSecret)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer border border-white/10"
                title={showEvmSecret ? 'Hide private key' : 'Show private key'}
              >
                {showEvmSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(vaultKeys.evmPrivateKey, 'evm-sec')}
                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-red-500/30"
              >
                {copiedKey === 'evm-sec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'evm-sec' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Cpu className="w-4 h-4 text-[#D9F99D]" />
            <span>Autonomous Execution Ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#D9F99D] hover:bg-[#bef264] text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
