import React, { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { wagmiConfig } from '../lib/wagmiConfig';
import { MAINNET_RPCS } from '../lib/web3Service';

const queryClient = new QueryClient();

interface WalletProvidersProps {
  children: React.ReactNode;
  solanaRpcUrl?: string;
}

export const MultiChainWalletProvider: React.FC<WalletProvidersProps> = ({ 
  children,
  solanaRpcUrl 
}) => {
  // Use custom RPC or public Solana Mainnet-Beta endpoint
  const endpoint = useMemo(() => {
    return solanaRpcUrl || MAINNET_RPCS.solana || clusterApiUrl('mainnet-beta');
  }, [solanaRpcUrl]);

  // Standard wallet adapters are auto-discovered via Wallet Standard in @solana/wallet-adapter-react
  const wallets = useMemo(() => [], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={false}>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
