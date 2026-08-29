import React, { useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldAlert, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { InternalTradingVault, getOrCreateTradingVault, resetTradingVault } from '../utils/vault';

export interface KeyViewerProps {
  onVaultReset?: () => void;
}

export const KeyViewer: React.FC<KeyViewerProps> = ({ onVaultReset }) => {
  const [vault, setVault] = useState<InternalTradingVault>(() => getOrCreateTradingVault());
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedSol, setCopiedSol] = useState(false);
  const [copiedEvm, setCopiedEvm] = useState(false);
  const [copiedSolPk, setCopiedSolPk] = useState(false);
  const [copiedEvmPk, setCopiedEvmPk] = useState(false);

  const handleCopy = (text: string, type: 'sol' | 'evm' | 'solPk' | 'evmPk') => {
    navigator.clipboard.writeText(text);
    if (type === 'sol') {
      setCopiedSol(true);
      setTimeout(() => setCopiedSol(false), 2000);
    } else if (type === 'evm') {
      setCopiedEvm(true);
      setTimeout(() => setCopiedEvm(false), 2000);
    } else if (type === 'solPk') {
      setCopiedSolPk(true);
      setTimeout(() => setCopiedSolPk(false), 2000);
    } else if (type === 'evmPk') {
      setCopiedEvmPk(true);
      setTimeout(() => setCopiedEvmPk(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to regenerate permanent vault keys? Any un-withdrawn funds must be moved first.')) {
      const newVault = resetTradingVault();
      setVault(newVault);
      if (onVaultReset) onVaultReset();
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#070707] border border-white/10 font-mono space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              PERSISTENT OPERATIONAL VAULT
            </h3>
            <p className="text-[10px] text-zinc-500">
              Deterministic single-user trading keypair (never lost across reloads)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-[#D9F99D]/50 transition-all cursor-pointer min-h-[44px]"
        >
          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#D9F99D]" />}
          <span>{isRevealed ? 'Hide Private Keys' : 'Show Private Keys'}</span>
        </button>
      </div>

      {/* Public Addresses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Solana Address */}
        <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
            <span>Solana Vault Address</span>
            <button
              onClick={() => handleCopy(vault.solanaPublicKey, 'sol')}
              className="text-[#D9F99D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedSol ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSol ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-xs text-white truncate font-mono bg-zinc-900/50 p-2 rounded border border-white/5">
            {vault.solanaPublicKey}
          </div>
        </div>

        {/* EVM Address */}
        <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
            <span>EVM / BSC Vault Address</span>
            <button
              onClick={() => handleCopy(vault.evmAddress, 'evm')}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedEvm ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEvm ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-xs text-white truncate font-mono bg-zinc-900/50 p-2 rounded border border-white/5">
            {vault.evmAddress}
          </div>
        </div>
      </div>

      {/* Revealed Private Keys Section */}
      {isRevealed ? (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Operational Private Keys (Keep Strictly Confidential)</span>
          </div>

          <div className="space-y-3">
            {/* Solana Secret Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="font-bold text-purple-400">Solana Private Key Array:</span>
                <button
                  onClick={() => handleCopy(vault.solanaPrivateKey, 'solPk')}
                  className="text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedSolPk ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSolPk ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="text-[11px] text-zinc-300 break-all bg-black p-2.5 rounded border border-white/10 select-all">
                {vault.solanaPrivateKey}
              </div>
            </div>

            {/* EVM Private Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="font-bold text-amber-400">EVM Hex Private Key:</span>
                <button
                  onClick={() => handleCopy(vault.evmPrivateKey, 'evmPk')}
                  className="text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedEvmPk ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEvmPk ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="text-[11px] text-zinc-300 break-all bg-black p-2.5 rounded border border-white/10 select-all">
                {vault.evmPrivateKey}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-red-500/20 text-[10px] text-zinc-400">
            <span>You can import these keys into Phantom or MetaMask anytime.</span>
            <button
              onClick={handleReset}
              className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate Vault</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-zinc-600" />
            <span>Private keys are securely obfuscated in local browser memory.</span>
          </div>
          <button
            onClick={() => setIsRevealed(true)}
            className="text-[11px] text-[#D9F99D] hover:underline font-bold cursor-pointer"
          >
            Click to Reveal
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyViewer;
