import React, { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { wagmiConfig } from '../lib/wagmiConfig';
import { getSolanaRpcUrl } from '../lib/web3Service';

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
  // Use custom RPC or environment RPC variable (never public clusterApiUrl due to 429 rate limits)
  const endpoint = useMemo(() => {
    return getSolanaRpcUrl(solanaRpcUrl);
  }, [solanaRpcUrl]);

  // Support Phantom, Solflare, Backpack and standard wallet extensions
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

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

