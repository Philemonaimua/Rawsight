import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const bscChain = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org/'] },
    public: { http: ['https://bsc-dataseed.binance.org/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
});

export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Robinhood Explorer', url: 'https://robinhoodchain.blockscout.com' },
  },
});

export const wagmiConfig = createConfig({
  chains: [bscChain, robinhoodChain],
  connectors: [
    injected(),
  ],
  transports: {
    [bscChain.id]: http('https://bsc-dataseed.binance.org/'),
    [robinhoodChain.id]: http('https://rpc.mainnet.chain.robinhood.com'),
  },
});
