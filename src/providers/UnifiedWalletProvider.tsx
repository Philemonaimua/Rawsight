import React, { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc, mainnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { robinhoodChainViem, SOLANA_MAINNET_CONFIG, BSC_MAINNET_CONFIG, ROBINHOOD_CHAIN_CONFIG } from '../lib/networks';

// Default Styles for Solana Wallet Adapter UI
import '@solana/wallet-adapter-react-ui/styles.css';

// -------------------------------------------------------------
// 1. WAGMI CONFIGURATION (BNB MAINNET + ROBINHOOD MAINNET + ETH)
// -------------------------------------------------------------
export const wagmiConfig = createConfig({
  chains: [bsc, robinhoodChainViem, mainnet],
  connectors: [
    metaMask(),
    injected({ target: 'metaMask' }),
    injected({
      target() {
        return {
          id: 'okxWallet',
          name: 'OKX Wallet',
          provider: typeof window !== 'undefined' ? (window as any).okxwallet : undefined,
        };
      },
    }),
    injected(),
  ],
  transports: {
    [bsc.id]: http(BSC_MAINNET_CONFIG.rpcUrl),
    [robinhoodChainViem.id]: http(ROBINHOOD_CHAIN_CONFIG.rpcUrl),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
});

// React Query Client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// -------------------------------------------------------------
// 2. UNIFIED WALLET PROVIDER COMPONENT
// -------------------------------------------------------------
export interface UnifiedWalletProviderProps {
  children: ReactNode;
  solanaRpcEndpoint?: string;
}

export const UnifiedWalletProvider: React.FC<UnifiedWalletProviderProps> = ({
  children,
  solanaRpcEndpoint = SOLANA_MAINNET_CONFIG.primaryRpc,
}) => {
  // Setup Solana Adapters (Solflare & Phantom)
  const solanaWallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={solanaRpcEndpoint}>
          <SolanaWalletProvider wallets={solanaWallets} autoConnect={false}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default UnifiedWalletProvider;
