import { Chain, LaunchSource, LaunchpadConfig } from '../types';

export const TARGET_LAUNCHPADS_AND_DEXS: LaunchpadConfig[] = [
  // -------------------------------------------------------------
  // SOLANA (SVM)
  // -------------------------------------------------------------
  {
    name: 'Pump.fun',
    chain: 'solana',
    type: 'BONDING_CURVE',
    contractOrProgramId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    routerAddress: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    description: 'Instant bonding curve mint & virtual SOL pool listener with automated Raydium migration',
    isBondingCurve: true,
    listenerTopicOrFilter: 'Program log: Instruction: InitializeMint / Buy',
  },
  {
    name: 'Moonshot',
    chain: 'solana',
    type: 'BONDING_CURVE',
    contractOrProgramId: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    routerAddress: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
    description: 'Fair-launch curve protocol with 100% LP burn on Meteora graduation',
    isBondingCurve: true,
    listenerTopicOrFilter: 'Program log: Instruction: BuyToken / Graduated',
  },
  {
    name: 'Best Wallet',
    chain: 'solana',
    type: 'PRESALE_FAIRLAUNCH',
    contractOrProgramId: 'BWLaunchpadSo11111111111111111111111111111111',
    routerAddress: 'BWLaunchpadSo11111111111111111111111111111111',
    description: 'Multi-chain exclusive early-access token presale & guaranteed liquidity allocation',
    isBondingCurve: false,
    listenerTopicOrFilter: 'Program log: Instruction: ClaimPresale / PoolCreated',
  },
  {
    name: 'Raydium',
    chain: 'solana',
    type: 'DEX_PAIR',
    contractOrProgramId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    routerAddress: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    description: 'Primary Solana AMM V4 / CLMM pool initializer and OpenBook market listener',
    isBondingCurve: false,
    listenerTopicOrFilter: 'Program log: initialize2: InitializeMarket / CreatePool',
  },
  {
    name: 'Jupiter',
    chain: 'solana',
    type: 'DEX_PAIR',
    contractOrProgramId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    routerAddress: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    description: 'Universal ultra-low latency routing aggregator & direct swap instruction builder',
    isBondingCurve: false,
    listenerTopicOrFilter: 'Jupiter Route API v6 stream',
  },
  {
    name: 'Meteora',
    chain: 'solana',
    type: 'DEX_PAIR',
    contractOrProgramId: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    routerAddress: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    description: 'Dynamic DLMM pools with concentrated volatility bin snipes',
    isBondingCurve: false,
    listenerTopicOrFilter: 'Program log: Instruction: InitializeCustomizablePermissionlessLbPair',
  },

  // -------------------------------------------------------------
  // BNB CHAIN (EVM - Chain ID 56)
  // -------------------------------------------------------------
  {
    name: 'Four.meme',
    chain: 'bnb',
    type: 'BONDING_CURVE',
    contractOrProgramId: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
    routerAddress: '0x2A31252AeeFFd65aFddFE6eE8896085a69882Fe7',
    description: 'Native BNB Chain bonding curve launcher with automated PancakeSwap V3 migration',
    isBondingCurve: true,
    listenerTopicOrFilter: 'TokenCreated(address,address,string,string,uint256)',
  },
  {
    name: 'PinkSale',
    chain: 'bnb',
    type: 'PRESALE_FAIRLAUNCH',
    contractOrProgramId: '0x7ee058420e5937496F5a2096f04cAA7721cF70cc',
    routerAddress: '0x407993575c91ce7643a4d4cCACc9A98c36eE1BBE',
    description: 'Fair-launch liquidity lock & automated PinkLock automated liquidity injector',
    isBondingCurve: false,
    listenerTopicOrFilter: 'LiquidityAdded(address,address,uint256,uint256)',
  },
  {
    name: 'Kommunitas',
    chain: 'bnb',
    type: 'PRESALE_FAIRLAUNCH',
    contractOrProgramId: '0x51Ecf308226487e59F38ff03D515ff1C1fFF3B2B',
    routerAddress: '0x51Ecf308226487e59F38ff03D515ff1C1fFF3B2B',
    description: 'Tierless decentralized incubator launchpad & community allocation pools',
    isBondingCurve: false,
    listenerTopicOrFilter: 'ProjectFinalized(address,uint256)',
  },
  {
    name: 'PancakeSwap',
    chain: 'bnb',
    type: 'DEX_PAIR',
    contractOrProgramId: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    description: 'Leading BNB Chain DEX. Event: PairCreated(address,address,address,uint256)',
    isBondingCurve: false,
    listenerTopicOrFilter: '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9',
  },
  {
    name: 'Biswap',
    chain: 'bnb',
    type: 'DEX_PAIR',
    contractOrProgramId: '0x858E3312ed3736154330b3837cf45b72B3c8044e',
    routerAddress: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
    description: 'Lowest fee DEX on BNB Chain with high-speed Multi-hop router',
    isBondingCurve: false,
    listenerTopicOrFilter: 'PairCreated(address,address,address,uint256)',
  },
  {
    name: 'THENA',
    chain: 'bnb',
    type: 'DEX_PAIR',
    contractOrProgramId: '0x20a3041B259e8CE8E354145287380a1460d60058',
    routerAddress: '0xd4ae7e21F63da112921b7876251bB811B55B3d4F',
    description: 've(3,3) liquidity layer with concentrated liquidity algebra routing',
    isBondingCurve: false,
    listenerTopicOrFilter: 'PoolCreated(address,address,address)',
  },

  // -------------------------------------------------------------
  // ROBINHOOD CHAIN (EVM - Chain ID 4663)
  // -------------------------------------------------------------
  {
    name: 'Hood.fun',
    chain: 'robinhood',
    type: 'BONDING_CURVE',
    contractOrProgramId: '0x466300000000000000000000000000000000400D',
    routerAddress: '0x466300000000000000000000000000000000400E',
    description: 'Native Robinhood Chain bonding curve launchpad with 0% gas subsidization',
    isBondingCurve: true,
    listenerTopicOrFilter: 'CurveCreated(address,address,uint256)',
  },
  {
    name: 'Flap',
    chain: 'robinhood',
    type: 'BONDING_CURVE',
    contractOrProgramId: '0xF1a9000000000000000000000000000000004663',
    routerAddress: '0xF1a9000000000000000000000000000000004664',
    description: 'Cross-chain bonding curve protocol with instant migration to Uniswap V3',
    isBondingCurve: true,
    listenerTopicOrFilter: 'FlapLaunch(address,address,string)',
  },
  {
    name: 'Pons',
    chain: 'robinhood',
    type: 'DIRECT_DEPLOY',
    contractOrProgramId: '0x9095000000000000000000000000000000004663',
    routerAddress: '0x9095000000000000000000000000000000004663',
    description: 'Fixed-supply instant direct deployer with automated full LP burn on initialization',
    isBondingCurve: false,
    listenerTopicOrFilter: 'DirectTokenDeployed(address,address,uint256)',
  },
  {
    name: 'Uniswap V3',
    chain: 'robinhood',
    type: 'DEX_PAIR',
    contractOrProgramId: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    description: 'Concentrated liquidity AMM. Event: PoolCreated(address,address,uint24,int24,address)',
    isBondingCurve: false,
    listenerTopicOrFilter: '0x783cca1c041245d80ba44b06374d6f523f249d26b537cd6b4065fabbdd5732a9',
  },
  {
    name: 'Ramses / Camelot',
    chain: 'robinhood',
    type: 'DEX_PAIR',
    contractOrProgramId: '0x6a94821a8d052B3cf1B9c7e0cce06c8F67f3B831',
    routerAddress: '0xc873fEcbd354f5A32E80E902244BEb6312a68199',
    description: 'Dynamic fee AMM & Nitro pool aggregator with directional slippage shielding',
    isBondingCurve: false,
    listenerTopicOrFilter: 'PairCreated(address,address,address,uint256)',
  },
  {
    name: 'Robinhood Swap',
    chain: 'robinhood',
    type: 'DEX_PAIR',
    contractOrProgramId: '0x4663BEEF00000000000000000000000000000001',
    routerAddress: '0x4663BEEF00000000000000000000000000000002',
    description: 'Native instant Robinhood Chain AMM router with zero-frontrun protection',
    isBondingCurve: false,
    listenerTopicOrFilter: 'PairCreated(address,address,address,uint256)',
  },
];

// Helper to get launchpads for a specific chain
export function getLaunchpadsByChain(chain: Chain): LaunchpadConfig[] {
  return TARGET_LAUNCHPADS_AND_DEXS.filter(l => l.chain === chain && l.isBondingCurve);
}

// Helper to get DEXs for a specific chain
export function getDexsByChain(chain: Chain): LaunchpadConfig[] {
  return TARGET_LAUNCHPADS_AND_DEXS.filter(l => l.chain === chain && !l.isBondingCurve);
}

// Get config for a specific launch source name
export function getLaunchpadConfig(name: LaunchSource): LaunchpadConfig | undefined {
  return TARGET_LAUNCHPADS_AND_DEXS.find(l => l.name === name);
}

// Router addresses dictionary for fast lookup
export const ROUTER_ADDRESSES = {
  // Solana
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  METEORA_DLMM: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
  // BNB Chain
  PANCAKESWAP_V2_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  FOUR_MEME_ROUTER: '0x2A31252AeeFFd65aFddFE6eE8896085a69882Fe7',
  BISWAP_ROUTER: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
  THENA_ROUTER: '0xd4ae7e21F63da112921b7876251bB811B55B3d4F',
  // Robinhood Chain
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  HOOD_FUN_ROUTER: '0x466300000000000000000000000000000000400E',
  CAMELOT_ROUTER: '0xc873fEcbd354f5A32E80E902244BEb6312a68199',
  ROBINHOOD_SWAP_ROUTER: '0x4663BEEF00000000000000000000000000000002',
};
