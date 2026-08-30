import { Connection } from '@solana/web3.js';
import { createPublicClient, http, defineChain } from 'viem';
import { bsc as bscViem, mainnet as mainnetViem } from 'viem/chains';
import { ethers } from 'ethers';

// ============================================================================
// 1. SOLANA MAINNET DEFINITIONS & SINGLETON PROVIDERS
// ============================================================================
export const SOLANA_MAINNET_CONFIG = {
  name: 'Solana Mainnet-Beta',
  cluster: 'mainnet-beta' as const,
  primaryRpc: 'https://api.mainnet-beta.solana.com',
  fallbackRpc: 'https://solana-mainnet.rpc.extrnode.com',
  nativeSymbol: 'SOL',
  nativeDecimals: 9,
  explorerUrl: 'https://solscan.io',
  wrappedNativeMint: 'So11111111111111111111111111111111111111112',
  gasBufferSol: 0.005,
};

// Singleton Solana connection instances
let solanaConnectionInstance: Connection | null = null;

export function getSolanaConnection(customRpc?: string): Connection {
  const rpcUrl = customRpc || SOLANA_MAINNET_CONFIG.primaryRpc;
  if (!solanaConnectionInstance || solanaConnectionInstance.rpcEndpoint !== rpcUrl) {
    solanaConnectionInstance = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return solanaConnectionInstance;
}

// ============================================================================
// 2. BNB SMART CHAIN (CHAIN ID: 56) DEFINITIONS & SINGLETONS
// ============================================================================
export const BSC_MAINNET_CONFIG = {
  id: 56,
  hexId: '0x38',
  name: 'BNB Smart Chain',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  fallbackRpc: 'https://bsc-dataseed1.defibit.io/',
  nativeSymbol: 'BNB',
  nativeDecimals: 18,
  explorerUrl: 'https://bscscan.com',
  routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap V2 Router
  wbnbAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  gasBufferBnb: 0.002,
};

// Singleton Viem public client for BSC
export const bscPublicClient = createPublicClient({
  chain: bscViem,
  transport: http(BSC_MAINNET_CONFIG.rpcUrl),
});

// Singleton Ethers provider for BSC
let bscEthersProvider: ethers.JsonRpcProvider | null = null;
export function getBscEthersProvider(): ethers.JsonRpcProvider {
  if (!bscEthersProvider) {
    bscEthersProvider = new ethers.JsonRpcProvider(BSC_MAINNET_CONFIG.rpcUrl, 56);
  }
  return bscEthersProvider;
}

// ============================================================================
// 3. ROBINHOOD CHAIN MAINNET (CHAIN ID: 4663) DEFINITIONS & SINGLETONS
// ============================================================================
export const ROBINHOOD_CHAIN_CONFIG = {
  id: 4663,
  hexId: '0x1237',
  name: 'Robinhood Chain Mainnet',
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  nativeSymbol: 'ETH',
  nativeDecimals: 18,
  explorerUrl: 'https://robinhoodchain.blockscout.com',
  routerAddress: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // Robinhood Swap Router
  wethAddress: '0x4200000000000000000000000000000000000006',
  gasBufferEth: 0.002,
};

export const robinhoodChainViem = defineChain({
  id: 4663,
  name: 'Robinhood Chain Mainnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
    },
    public: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Explorer',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
});

export const bscChain = bscViem;
export const robinhoodChain = robinhoodChainViem;

// Singleton Viem public client for Robinhood Chain
export const robinhoodPublicClient = createPublicClient({
  chain: robinhoodChainViem,
  transport: http(ROBINHOOD_CHAIN_CONFIG.rpcUrl),
});

// Singleton Ethers provider for Robinhood Chain
let robinhoodEthersProvider: ethers.JsonRpcProvider | null = null;
export function getRobinhoodEthersProvider(): ethers.JsonRpcProvider {
  if (!robinhoodEthersProvider) {
    robinhoodEthersProvider = new ethers.JsonRpcProvider(ROBINHOOD_CHAIN_CONFIG.rpcUrl, 4663);
  }
  return robinhoodEthersProvider;
}

// ============================================================================
// 4. UNIFIED NETWORK DICTIONARY & HELPERS
// ============================================================================
export type SupportedChain = 'solana' | 'bnb' | 'robinhood';

export interface ChainMeta {
  key: SupportedChain;
  name: string;
  nativeSymbol: string;
  explorerUrl: string;
  isEvm: boolean;
  chainId?: number;
  gasBuffer: number;
}

export const SUPPORTED_NETWORKS: Record<SupportedChain, ChainMeta> = {
  solana: {
    key: 'solana',
    name: SOLANA_MAINNET_CONFIG.name,
    nativeSymbol: SOLANA_MAINNET_CONFIG.nativeSymbol,
    explorerUrl: SOLANA_MAINNET_CONFIG.explorerUrl,
    isEvm: false,
    gasBuffer: SOLANA_MAINNET_CONFIG.gasBufferSol,
  },
  bnb: {
    key: 'bnb',
    name: BSC_MAINNET_CONFIG.name,
    nativeSymbol: BSC_MAINNET_CONFIG.nativeSymbol,
    explorerUrl: BSC_MAINNET_CONFIG.explorerUrl,
    isEvm: true,
    chainId: BSC_MAINNET_CONFIG.id,
    gasBuffer: BSC_MAINNET_CONFIG.gasBufferBnb,
  },
  robinhood: {
    key: 'robinhood',
    name: ROBINHOOD_CHAIN_CONFIG.name,
    nativeSymbol: ROBINHOOD_CHAIN_CONFIG.nativeSymbol,
    explorerUrl: ROBINHOOD_CHAIN_CONFIG.explorerUrl,
    isEvm: true,
    chainId: ROBINHOOD_CHAIN_CONFIG.id,
    gasBuffer: ROBINHOOD_CHAIN_CONFIG.gasBufferEth,
  },
};

export function getExplorerTxUrl(chain: SupportedChain, txHash: string): string {
  if (chain === 'solana') {
    return `${SOLANA_MAINNET_CONFIG.explorerUrl}/tx/${txHash}`;
  }
  if (chain === 'bnb') {
    return `${BSC_MAINNET_CONFIG.explorerUrl}/tx/${txHash}`;
  }
  return `${ROBINHOOD_CHAIN_CONFIG.explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chain: SupportedChain, address: string): string {
  if (chain === 'solana') {
    return `${SOLANA_MAINNET_CONFIG.explorerUrl}/account/${address}`;
  }
  if (chain === 'bnb') {
    return `${BSC_MAINNET_CONFIG.explorerUrl}/address/${address}`;
  }
  return `${ROBINHOOD_CHAIN_CONFIG.explorerUrl}/address/${address}`;
}
