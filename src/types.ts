export type Chain = 'solana' | 'bnb' | 'robinhood';

export interface ChainConfig {
  id: Chain;
  name: string;
  symbol: string;
  nativeCoin: string;
  badgeColor: string;
  iconBg: string;
  tpsOrSpeed: string;
  avgGas: string;
  dex: string;
  explorerUrl: string;
}

export type ScrutinyStatus = 
  | 'PASSED_RAWSIGHT' 
  | 'EVALUATING' 
  | 'REJECTED_LOW_LP' 
  | 'REJECTED_INSIDER_CLUSTER' 
  | 'REJECTED_HONEYPOT_RISK' 
  | 'REJECTED_MINT_UNLOCKED';

export interface MemeToken {
  id: string;
  name: string;
  symbol: string;
  chain: Chain;
  contractAddress: string;
  price: number;
  entryPrice?: number;
  currentPrice: number;
  athPrice: number;
  change24h: number;
  mcap: number;
  liquidityUsd: number;
  lpLockedPercent: number;
  top10HolderPercent: number;
  devHoldingsPercent: number;
  smartMoneyScore: number; // 0-100
  rugRiskScore: number; // 0-100 (lower is safer)
  viralityScore: number; // 0-100
  mintRenounced: boolean;
  freezeDisabled: boolean;
  scrutinyStatus: ScrutinyStatus;
  auditBadges: string[];
  auditFailureReason?: string;
  chartHistory: number[];
  discoveredAt: number;
  isSimulatingRug?: boolean;
  isSimulatingPump?: boolean;
}

export type PositionStatus = 
  | 'ACTIVE' 
  | 'CLOSED_TAKE_PROFIT' 
  | 'CLOSED_RUG_SHIELD' 
  | 'CLOSED_MANIPULATION_DETECTED' 
  | 'CLOSED_STOP_LOSS' 
  | 'CLOSED_MANUAL';

export interface TradePosition {
  id: string;
  token: MemeToken;
  chain: Chain;
  investedAmountUsd: number;
  tokenAmount: number;
  entryTimestamp: number;
  entryPrice: number;
  currentPrice: number;
  currentPnlUsd: number;
  currentPnlPercent: number;
  highestPnlPercent: number;
  status: PositionStatus;
  exitPrice?: number;
  exitReason?: string;
  exitTimestamp?: number;
  exitPnlUsd?: number;
  exitPnlPercent?: number;
  takeProfitTargetPercent: number;
  stopLossTargetPercent: number;
  insiderRiskWarning?: string;
  lpDrainWarning?: string;
  executionMode?: 'LIVE_MAINNET' | 'SIMULATION';
  txHash?: string;
  trailingStopActive?: boolean;
  rugShieldTriggered?: boolean;
}

export type LogType = 
  | 'BUY_SNIPE' 
  | 'SELL_TAKE_PROFIT' 
  | 'SELL_RUG_SHIELD' 
  | 'SELL_INSIDER_ALERT' 
  | 'SELL_STOP_LOSS' 
  | 'CLOSED_MANUAL'
  | 'RADAR_REJECT' 
  | 'DEPOSIT' 
  | 'WITHDRAW'
  | 'WALLET_CONNECT'
  | 'MODE_SWITCH'
  | 'STRATEGY_UPDATE';

export interface TradeLog {
  id: string;
  timestamp: number;
  type: LogType;
  tokenSymbol: string;
  tokenName: string;
  chain: Chain;
  amountUsd: number;
  pnlUsd?: number;
  pnlPercent?: number;
  note: string;
  txHash: string;
  riskFactor?: string;
  isLive?: boolean;
}

export type SizingMode = 'FIXED_USD' | 'PERCENT_NAV' | 'SCRUTINY_WEIGHTED';
export type TradingMode = 'LIVE_MAINNET' | 'SIMULATION_SANDBOX';
export type GasPriority = 'NORMAL' | 'FAST' | 'TURBO' | 'ULTRA';

export interface VaultConfig {
  tradingMode: TradingMode;
  autoTradeEnabled: boolean;
  riskProfile: 'conservative' | 'balanced' | 'degen';
  
  // Custom Position Sizing Parameters
  sizingMode: SizingMode;
  allocationPerTradeUsd: number; // For FIXED_USD mode
  allocationPercentNav: number;  // For PERCENT_NAV mode (e.g. 5%)
  minTradeSizeUsd: number;       // Safeguard floor
  maxTradeSizeUsd: number;       // Safeguard ceiling
  maxActivePositions: number;
  
  // Take-profit & Risk Management
  takeProfitPercent: number; // e.g. 80 (+80%)
  stopLossPercent: number; // e.g. 20 (-20%)
  trailingStopEnabled: boolean;
  trailingStopDistance: number;
  
  // Scrutiny Thresholds
  minLiquidityUsd: number; // e.g. 20000
  minLpLockedPercent: number; // e.g. 90
  maxTop10Concentration: number; // e.g. 15
  maxDevHoldingPercent: number; // e.g. 4
  rugShieldSensitivity: 'HIGH' | 'MAX_SAFEGUARD' | 'INSTANT_DODGE';
  
  // Multi-chain routing
  allowedChains: {
    solana: boolean;
    bnb: boolean;
    robinhood: boolean;
  };

  // Live Trading Execution & MEV Safeguards
  slippageTolerancePercent: number; // e.g. 1.0%
  jitoMevProtection: boolean;
  jitoTipSol: number; // e.g. 0.002 SOL tip for private bundle routing
  gasPriority: GasPriority;
  autoSignDelegatedKey: boolean;
  customRpc: {
    solana: string;
    bnb: string;
    robinhood: string;
  };
  
  audioAlerts: boolean;
}

export interface LiveWalletState {
  isConnected: boolean;
  walletProvider: 'Autonomous Vault Key' | 'Phantom' | 'Solflare' | 'MetaMask' | 'Rabby' | 'Robinhood Gateway' | null;
  address: string;
  chain: Chain;
  vaultAddresses: {
    solana: string;
    bnb: string;
    robinhood: string;
  };
  balances: {
    sol: number;
    bnb: number;
    usdc: number;
    totalUsd: number;
  };
  rpcLatencyMs: number;
  activeNetwork: string;
}

export interface VaultState {
  cashBalanceUsd: number;
  allocatedInPositionsUsd: number;
  totalNavUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  rugsShieldedCount: number;
  insiderDumpsDodgedCount: number;
  lastUpdated?: number;
  historicalCurve?: { time: string; totalValue: number; pnl: number }[];
}

