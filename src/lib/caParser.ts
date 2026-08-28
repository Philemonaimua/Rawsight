import { Chain } from '../types';

/**
 * Standard Known Quote Tokens per chain to accurately extract
 * the actual Token Contract Address (CA) vs Pair / Pool Address.
 */
export const KNOWN_QUOTE_TOKENS: Record<Chain, { address: string; symbol: string }[]> = {
  solana: [
    { address: 'So11111111111111111111111111111111111111112', symbol: 'WSOL' },
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' },
    { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT' },
  ],
  bnb: [
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB' },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT' },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC' },
    { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD' },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH' },
  ],
  robinhood: [
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH' },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC' },
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT' },
    { address: '0x4663000000000000000000000000000000000001', symbol: 'RH-NATIVE' },
  ],
};

/**
 * Validates whether an address is a syntactically clean Solana Mint (Base58, 32-44 chars)
 * or EVM Token Address (0x + 40 hex chars).
 */
export function isValidContractAddress(address: string, chain: Chain): boolean {
  if (!address || typeof address !== 'string') return false;
  const clean = address.trim();

  if (chain === 'solana') {
    // Base58 check (no 0, O, I, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(clean);
  }

  // EVM regex
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;
  return evmRegex.test(clean);
}

/**
 * EVM PAIR PARSING:
 * Given token0 and token1 from a PairCreated(address token0, address token1, address pair, uint) event,
 * determines the actual Memecoin Token Contract Address by filtering out known quote tokens (WBNB, USDT, etc.).
 */
export function extractEvmTokenAddress(token0: string, token1: string, chain: Chain = 'bnb'): string {
  const t0 = (token0 || '').toLowerCase().trim();
  const t1 = (token1 || '').toLowerCase().trim();

  const quotes = KNOWN_QUOTE_TOKENS[chain] || KNOWN_QUOTE_TOKENS.bnb;
  const quoteSet = new Set(quotes.map(q => q.address.toLowerCase()));

  // If token0 is quote, token1 is the target memecoin
  if (quoteSet.has(t0) && !quoteSet.has(t1)) {
    return token1;
  }
  // If token1 is quote, token0 is the target memecoin
  if (quoteSet.has(t1) && !quoteSet.has(t0)) {
    return token0;
  }
  // Fallback if neither or both are quote tokens: pick token0
  return token0 || token1;
}

/**
 * SOLANA MINT PARSING:
 * Extracts the actual SPL Token Mint Public Key from a Pump.fun, Raydium, or Moonshot event,
 * distinguishing it from the Bonding Curve Account, Program ID, or Pair ID.
 */
export function extractSolanaMintAddress(payload: {
  mint?: string;
  tokenMint?: string;
  accounts?: string[];
  programId?: string;
}): string {
  if (payload.mint && isValidContractAddress(payload.mint, 'solana')) {
    return payload.mint;
  }
  if (payload.tokenMint && isValidContractAddress(payload.tokenMint, 'solana')) {
    return payload.tokenMint;
  }
  // In Raydium AMM createPool / OpenBook, account index 8 or 9 is the base token mint
  if (payload.accounts && payload.accounts.length > 0) {
    for (const acc of payload.accounts) {
      if (isValidContractAddress(acc, 'solana') && !acc.startsWith('6EF8') && !acc.startsWith('675k') && acc !== 'So11111111111111111111111111111111111111112') {
        return acc;
      }
    }
  }
  return payload.mint || 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
}

/**
 * Generates direct DexScreener URL for verified token page
 */
export function getDexScreenerUrl(chain: Chain, contractAddress: string): string {
  const ca = encodeURIComponent(contractAddress.trim());
  if (chain === 'solana') {
    return `https://dexscreener.com/solana/${ca}`;
  }
  if (chain === 'bnb') {
    return `https://dexscreener.com/bsc/${ca}`;
  }
  return `https://dexscreener.com/arbitrum/${ca}`;
}

/**
 * Generates direct Block Explorer URL (Solscan / BscScan / Blockscout)
 */
export function getExplorerTokenUrl(chain: Chain, contractAddress: string): string {
  const ca = encodeURIComponent(contractAddress.trim());
  if (chain === 'solana') {
    return `https://solscan.io/token/${ca}`;
  }
  if (chain === 'bnb') {
    return `https://bscscan.com/token/${ca}`;
  }
  return `https://robinhoodchain.blockscout.com/token/${ca}`;
}

/**
 * Safe visual formatting for addresses (e.g. 7XwK4...pQ9s)
 * Keeps the full contract address intact in state/props.
 */
export function formatAddressDisplay(address: string, startLen = 6, endLen = 4): string {
  if (!address || typeof address !== 'string') return '';
  const clean = address.trim();
  if (clean.length <= startLen + endLen) return clean;
  return `${clean.slice(0, startLen)}...${clean.slice(-endLen)}`;
}
