import React, { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { wagmiConfig } from '../lib/wagmiConfig';
import { MAINNET_RPCS } from '../lib/web3Service';

// Include wallet adapter default UI styles
import '@solana/wallet-adapter-react-ui/styles.css';

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

  // Standard Wallet auto-detection (empty wallets array allows @solana/wallet-adapter-react to detect standard wallet extensions)
  const wallets = useMemo(() => [], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

