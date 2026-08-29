import React, { useState } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Zap, 
  Radio, 
  ChevronDown, 
  LogOut, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMainnetBalances } from '../hooks/useMainnetBalances';
import { LiveWalletModal } from './LiveWalletModal';
import { VaultConfig } from '../types';

export interface HeaderWalletConnectProps {
  vaultConfig: VaultConfig;
  onUpdateConfig: (config: VaultConfig) => void;
  onOpenLiveWalletModal?: () => void;
}

export const HeaderWalletConnect: React.FC<HeaderWalletConnectProps> = ({
  vaultConfig,
  onUpdateConfig,
  onOpenLiveWalletModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Solana Wallet Adapter hooks
  const { publicKey: solPubkey, connected: solConnected, disconnect: disconnectSol, wallet: solWallet } = useWallet();

  // Wagmi EVM hooks
  const { address: evmAddress, isConnected: evmConnected, connector } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();

  const solAddressStr = solPubkey ? solPubkey.toBase58() : '';
  const isAnyConnected = solConnected || evmConnected;

  // Real-time mainnet balances hook
  const { balances, refetch: refetchBalances } = useMainnetBalances({
    solanaAddress: solAddressStr,
    evmAddress: evmAddress,
    solanaRpcUrl: vaultConfig.customRpc?.solana,
    bnbRpcUrl: vaultConfig.customRpc?.bnb,
    robinhoodRpcUrl: vaultConfig.customRpc?.robinhood,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    if (solConnected) disconnectSol();
    if (evmConnected) disconnectEvm();
    setIsDropdownOpen(false);
  };

  const activeDisplayAddress = solAddressStr || evmAddress || '';
  const activeChainLabel = solConnected ? 'Solana Mainnet' : evmConnected ? 'BNB / Robinhood' : 'Disconnected';
  const activeProviderName = solConnected ? (solWallet?.adapter.name || 'Solana') : (connector?.name || 'EVM');

  return (
    <>
      <div className="relative font-mono flex items-center gap-2">
        {isAnyConnected ? (
          <div className="flex items-center gap-2">
            {/* Live Balance Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070707] border border-white/10 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-pulse" />
              {solConnected && (
                <span className="font-bold text-[#D9F99D]">
                  {balances.sol.toFixed(3)} SOL
                </span>
              )}
              {evmConnected && (
                <span className="font-bold text-amber-400">
                  {balances.bnb.toFixed(3)} BNB
                </span>
              )}
              <span className="text-[11px] text-zinc-500">
                (${balances.totalUsd.toFixed(2)})
              </span>
              <button
                onClick={() => refetchBalances()}
                className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                title="Refresh balances"
              >
                <RefreshCw className={`w-3 h-3 ${balances.isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Wallet Dropdown Trigger */}
            <div className="relative">
              <button
                id="btn-header-wallet-dropdown"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#D9F99D]/40 text-xs font-bold text-white hover:bg-[#D9F99D]/10 transition-all cursor-pointer min-h-[44px]"
              >
                <div className="w-5 h-5 rounded-full bg-[#D9F99D]/20 text-[#D9F99D] flex items-center justify-center text-[10px] font-black">
                  {solConnected ? 'SOL' : 'EVM'}
                </div>
                <span>
                  {activeDisplayAddress.slice(0, 4)}...{activeDisplayAddress.slice(-4)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D9F99D]" />
                      <span className="text-xs font-bold text-white">{activeProviderName}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {activeChainLabel}
                    </span>
                  </div>

                  {/* Address with Copy & Explorer */}
                  <div className="p-2 rounded bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300 truncate">
                      {activeDisplayAddress.slice(0, 8)}...{activeDisplayAddress.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(activeDisplayAddress)}
                        className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                        title="Copy address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#D9F99D]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={solConnected ? `https://solscan.io/account/${activeDisplayAddress}` : `https://bscscan.com/address/${activeDisplayAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px]"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#D9F99D]" />
                      <span>Wallet Settings & RPC</span>
                    </button>

                    <button
                      onClick={handleDisconnect}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Disconnected State Button */
          <button
            id="btn-header-connect-wallet"
            onClick={() => {
              if (onOpenLiveWalletModal) {
                onOpenLiveWalletModal();
              } else {
                setIsModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#D9F99D] hover:bg-[#bef264] text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(217,249,157,0.25)] cursor-pointer min-h-[44px]"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>

      {/* Embedded Live Wallet Modal */}
      {isModalOpen && (
        <LiveWalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          walletState={{
            isConnected: isAnyConnected,
            walletProvider: activeProviderName,
            address: activeDisplayAddress,
            chain: solConnected ? 'solana' : 'bnb',
            vaultAddresses: {
              solana: solAddressStr,
              bnb: evmAddress || '',
              robinhood: evmAddress || '',
            },
            balances: {
              sol: balances.sol,
              bnb: balances.bnb,
              usdc: balances.usdc,
              totalUsd: balances.totalUsd,
            },
            rpcLatencyMs: 14,
            activeNetwork: solConnected ? 'Solana Mainnet-Beta' : 'BNB Smart Chain',
          }}
          vaultConfig={vaultConfig}
          onUpdateConfig={onUpdateConfig}
        />
      )}
    </>
  );
};

export default HeaderWalletConnect;
