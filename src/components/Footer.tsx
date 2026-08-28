import React from 'react';
import { ShieldCheck, Activity, Terminal, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenWallet: () => void;
  onOpenStrategy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenWallet, onOpenStrategy }) => {
  return (
    <footer className="w-full border-t border-[#D9F99D]/20 bg-[#050505] text-zinc-400 font-mono text-xs mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-white/5">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#D9F99D] rounded-sm flex items-center justify-center text-black font-black text-xs">
                R
              </div>
              <span className="text-sm font-black text-white tracking-tight">
                RAW<span className="text-[#D9F99D]">SIGHT</span>
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30 font-bold">
                Mainnet Core
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm">
              Autonomous multi-chain algorithmic liquidity vault and rug shield defense engine. Operating non-custodially on Solana, BNB Chain, and Robinhood Chain.
            </p>
          </div>

          {/* Network Health */}
          <div className="md:col-span-4 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
              Multi-Chain Mesh Connectivity
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9F99D]" />
                  <span>Solana Cluster (Raydium / Orca)</span>
                </span>
                <span className="text-[#D9F99D] font-bold text-[10px]">99.98% UP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>BNB Smart Chain (PancakeSwap)</span>
                </span>
                <span className="text-amber-400 font-bold text-[10px]">3.0 Gwei</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9F99D]" />
                  <span>Robinhood Chain (ID: 4663)</span>
                </span>
                <span className="text-[#D9F99D] font-bold text-[10px]">Active</span>
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="md:col-span-3 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
              Terminal Utilities
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                type="button"
                onClick={onOpenWallet}
                className="text-left text-zinc-300 hover:text-[#D9F99D] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Web3 Wallet & Keypair Hub</span>
              </button>
              <button
                type="button"
                onClick={onOpenStrategy}
                className="text-left text-zinc-300 hover:text-[#D9F99D] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Vault Strategy & Sizing</span>
              </button>
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D9F99D]" />
                <span>Zero Custodial Risk • Private Keys Kept Client-Side</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright and ACE Creator Credit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span>© {new Date().getFullYear()} Rawsight Multi-Chain Vault System. All cryptographic operations signed on-chain.</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D] font-bold tracking-wider shadow-[0_0_10px_rgba(217,249,157,0.15)]">
              <span className="w-1 h-1 rounded-full bg-[#D9F99D] animate-ping" />
              Created by ACE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Mainnet Beta</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">MEV Protected</span>
            <span className="text-zinc-500">|</span>
            <span className="text-[#D9F99D]">Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
