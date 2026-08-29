import { Connection, VersionedTransaction } from '@solana/web3.js';
import { ethers } from 'ethers';

const PANCAKESWAP_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
];

const UNISWAP_V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
];

export interface SwapQuoteResult {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  rawQuote?: any;
}

export interface ExecuteSwapParams {
  chain: 'solana' | 'bnb' | 'robinhood';
  userAddress: string;
  inputToken: string;
  outputToken: string;
  amount: number;
  slippageBps?: number; // e.g. 100 = 1%, 500 = 5%
  solanaSignTransaction?: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  evmSigner?: ethers.Signer;
  customRpc?: string;
}

export interface SwapExecutionResult {
  success: boolean;
  txHash: string;
  inAmount: number;
  outAmount: number;
  explorerUrl: string;
  error?: string;
}

// -------------------------------------------------------------
// 1. SOLANA JUPITER V6 SWAP SERVICE
// -------------------------------------------------------------
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amountSol: number,
  slippageBps: number = 100
): Promise<SwapQuoteResult> {
  const amountLamports = Math.floor(amountSol * 1_000_000_000);
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=${slippageBps}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.statusText}`);
  }

  const quote = await response.json();
  return {
    inAmount: (Number(quote.inAmount) / 1_000_000_000).toString(),
    outAmount: quote.outAmount,
    priceImpactPct: parseFloat(quote.priceImpactPct || '0'),
    rawQuote: quote,
  };
}

export async function executeJupiterSwap({
  userAddress,
  inputToken,
  outputToken,
  amount,
  slippageBps = 100,
  solanaSignTransaction,
  customRpc = 'https://api.mainnet-beta.solana.com',
}: ExecuteSwapParams): Promise<SwapExecutionResult> {
  if (!solanaSignTransaction) {
    throw new Error('Solana wallet signTransaction function is required.');
  }

  const quote = await getJupiterQuote(inputToken, outputToken, amount, slippageBps);

  const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote.rawQuote,
      userPublicKey: userAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!swapResponse.ok) {
    const errText = await swapResponse.text();
    throw new Error(`Jupiter swap payload failed: ${errText}`);
  }

  const { swapTransaction } = await swapResponse.json();
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  const signedTx = await solanaSignTransaction(transaction);
  const connection = new Connection(customRpc, 'confirmed');
  const rawTx = signedTx.serialize();
  
  const txid = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    maxRetries: 3,
  });

  return {
    success: true,
    txHash: txid,
    inAmount: amount,
    outAmount: parseFloat(quote.outAmount),
    explorerUrl: `https://solscan.io/tx/${txid}`,
  };
}

// -------------------------------------------------------------
// 2. BNB CHAIN PANCAKESWAP V2 / V3 SWAP SERVICE
// -------------------------------------------------------------
const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

export async function executePancakeSwap({
  outputToken,
  amount,
  slippageBps = 100,
  evmSigner,
}: ExecuteSwapParams): Promise<SwapExecutionResult> {
  if (!evmSigner) {
    throw new Error('EVM signer is required for BSC trades.');
  }

  const router = new ethers.Contract(PANCAKE_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, evmSigner);
  const userAddr = await evmSigner.getAddress();
  const path = [WBNB_ADDRESS, outputToken];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const amountInWei = ethers.parseEther(amount.toString());

  // Calculate Slippage Protection
  let amountOutMin = BigInt(0);
  let expectedOut = 0;
  try {
    const amountsOut = await router.getAmountsOut(amountInWei, path);
    const expectedWei = amountsOut[1];
    expectedOut = parseFloat(ethers.formatEther(expectedWei));
    amountOutMin = (expectedWei * BigInt(10000 - slippageBps)) / BigInt(10000);
  } catch (e) {
    console.warn('Could not query getAmountsOut, proceeding with minimal buffer:', e);
  }

  const tx = await router.swapExactETHForTokens(
    amountOutMin,
    path,
    userAddr,
    deadline,
    { value: amountInWei }
  );

  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash || tx.hash,
    inAmount: amount,
    outAmount: expectedOut,
    explorerUrl: `https://bscscan.com/tx/${receipt.hash || tx.hash}`,
  };
}

// -------------------------------------------------------------
// 3. ROBINHOOD CHAIN (4663) L2 EVM SWAP SERVICE
// -------------------------------------------------------------
const ROBINHOOD_ROUTER_ADDRESS = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
const WETH_ROBINHOOD = '0x4200000000000000000000000000000000000006';

export async function executeRobinhoodSwap({
  outputToken,
  amount,
  slippageBps = 100,
  evmSigner,
}: ExecuteSwapParams): Promise<SwapExecutionResult> {
  if (!evmSigner) {
    throw new Error('EVM signer is required for Robinhood Chain trades.');
  }

  const router = new ethers.Contract(ROBINHOOD_ROUTER_ADDRESS, UNISWAP_V2_ROUTER_ABI, evmSigner);
  const userAddr = await evmSigner.getAddress();
  const path = [WETH_ROBINHOOD, outputToken];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const amountInWei = ethers.parseEther(amount.toString());

  // Calculate Slippage Protection
  let amountOutMin = BigInt(0);
  let expectedOut = 0;
  try {
    const amountsOut = await router.getAmountsOut(amountInWei, path);
    const expectedWei = amountsOut[1];
    expectedOut = parseFloat(ethers.formatEther(expectedWei));
    amountOutMin = (expectedWei * BigInt(10000 - slippageBps)) / BigInt(10000);
  } catch (e) {
    console.warn('Could not query getAmountsOut on Robinhood Chain:', e);
  }

  const tx = await router.swapExactETHForTokens(
    amountOutMin,
    path,
    userAddr,
    deadline,
    { value: amountInWei }
  );

  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash || tx.hash,
    inAmount: amount,
    outAmount: expectedOut,
    explorerUrl: `https://robinhoodchain.blockscout.com/tx/${receipt.hash || tx.hash}`,
  };
}

// -------------------------------------------------------------
// UNIFIED SWAP ROUTER
// -------------------------------------------------------------
export async function executeMainnetSwap(params: ExecuteSwapParams): Promise<SwapExecutionResult> {
  if (params.chain === 'solana') {
    return executeJupiterSwap(params);
  } else if (params.chain === 'bnb') {
    return executePancakeSwap(params);
  } else if (params.chain === 'robinhood') {
    return executeRobinhoodSwap(params);
  } else {
    throw new Error(`Unsupported trading chain: ${params.chain}`);
  }
}
