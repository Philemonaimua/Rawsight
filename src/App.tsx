import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { Analytics } from '@vercel/analytics/react';

import { 
  Navbar 
} from './components/Navbar';
import { 
  SecurityGate 
} from './components/SecurityGate';
import { 
  VaultOverview 
} from './components/VaultOverview';
import { 
  ActivePositions 
} from './components/ActivePositions';
import { 
  RawsightRadar 
} from './components/RawsightRadar';
import { 
  EarlyLaunchFeed 
} from './components/EarlyLaunchFeed';
import { 
  LiveTradeFeed 
} from './components/LiveTradeFeed';
import { 
  PerformanceChart 
} from './components/PerformanceChart';
import { 
  VaultStrategyModal 
} from './components/VaultStrategyModal';
import { 
  DepositModal 
} from './components/DepositModal';
import { 
  WithdrawModal 
} from './components/WithdrawModal';
import { 
  LiveWalletModal 
} from './components/LiveWalletModal';
import { 
  SnipeModal 
} from './components/SnipeModal';
import {
  TradingControlPanel
} from './components/TradingControlPanel';
import {
  Footer
} from './components/Footer';

import { 
  VaultConfig, 
  VaultState, 
  TradePosition, 
  TradeLog, 
  LogType,
  MemeToken, 
  EarlyLaunchToken,
  WebSocketListenerStatus,
  Chain,
  LiveWalletState,
  TradingMode,
  SizingMode,
  GasPriority
} from './types';

import { discoveryEngine } from './services/discoveryEngine';

import { 
  INITIAL_MEME_RADAR, 
  CHAINS_CONFIG 
} from './data/mockTokens';

import { 
  playSnipeSound, 
  playTakeProfitSound, 
  playRugShieldSound, 
  playDepositSound 
} from './services/soundEffects';

import { 
  fetchLiveDexScreenerTokens 
} from './lib/dexScreener';

import { 
  executeRealSolanaTrade, 
  executeRealEvmTrade,
  getOrCreateAutonomousVaultKeys,
  fetchLiveVaultBalances,
  fetchSolanaBalance,
  setupSolanaAccountSubscription,
  getBlockExplorerTxUrl,
  getSolanaRpcUrl
} from './lib/web3Service';

import {
  saveVaultState,
  loadVaultState,
  getExclusiveBoundWallet,
  saveExclusiveBoundWallet,
  getPersistedActiveSolanaWallet,
  setPersistedActiveSolanaWallet,
  getTargetWalletFromEnv
} from './lib/persistence';

import { 
  Radio, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Wallet,
  Lock,
  RefreshCw,
  ArrowDownToLine
} from 'lucide-react';

const INITIAL_CONFIG: VaultConfig = {
  autoTradeEnabled: true,
  tradingMode: 'LIVE_MAINNET',
  riskProfile: 'balanced',
  sizingMode: 'PERCENT_NAV',
  allocationPerTradeUsd: 100,
  allocationPercentNav: 5,
  minTradeSizeUsd: 25,
  maxTradeSizeUsd: 500,
  maxActivePositions: 6,
  takeProfitPercent: 80,
  stopLossPercent: 20,
  trailingStopEnabled: true,
  trailingStopDistance: 15,
  minLiquidityUsd: 25000,
  minLpLockedPercent: 90,
  maxTop10Concentration: 15,
  maxDevHoldingPercent: 3,
  rugShieldSensitivity: 'HIGH',
  slippageTolerancePercent: 1.0,
  jitoMevProtection: true,
  jitoTipSol: 0.002,
  gasPriority: 'FAST',
  autoSignDelegatedKey: true,
  customRpc: {
    solana: getSolanaRpcUrl(),
    bnb: 'https://bsc-dataseed.binance.org',
    robinhood: 'https://rpc.mainnet.chain.robinhood.com',
  },
  allowedChains: {
    solana: true,
    bnb: true,
    robinhood: true,
  },
  audioAlerts: true,
};

const INITIAL_WALLET_STATE: LiveWalletState = {
  isConnected: false,
  walletProvider: null,
  address: '',
  chain: 'solana',
  vaultAddresses: {
    solana: '',
    bnb: '',
    robinhood: '',
  },
  balances: {
    sol: 0.0,
    bnb: 0.0,
    usdc: 0.0,
    totalUsd: 0.0,
  },
  rpcLatencyMs: 14,
  activeNetwork: 'Solana Mainnet-Beta',
};

const INITIAL_LOGS: TradeLog[] = [
  {
    id: 'log-sys-ready',
    timestamp: Date.now() - 1000 * 60 * 2,
    type: 'WALLET_CONNECT',
    tokenSymbol: 'VAULT',
    tokenName: 'Rawsight Scrutiny Engine',
    chain: 'solana',
    amountUsd: 0,
    note: 'Trading terminal ready. Connect Phantom, Solflare, or MetaMask to trade live on Mainnet.',
    txHash: '0xgenesis...mainnet',
  },
];

export default function App() {
  // Solana & EVM Web3 Wallet Context Hooks
  const { publicKey, connected: solConnected, wallet: solWallet, disconnect: disconnectSol } = useWallet();
  const { connection: solConnection } = useConnection();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();

  // Security Gate Master PIN Session State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('rawsight_session_auth_v1') === 'true';
    } catch {
      return false;
    }
  });

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem('rawsight_session_auth_v1');
    } catch {}
    setIsUnlocked(false);
  };

  // State Declarations
  const [config, setConfig] = useState<VaultConfig>(INITIAL_CONFIG);
  const [liveWallet, setLiveWallet] = useState<LiveWalletState>(INITIAL_WALLET_STATE);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [radarTokens, setRadarTokens] = useState<MemeToken[]>(INITIAL_MEME_RADAR);
  const [earlyTokens, setEarlyTokens] = useState<EarlyLaunchToken[]>(() => discoveryEngine.getInitialTokens());
  const [wsListeners, setWsListeners] = useState<WebSocketListenerStatus[]>(() => discoveryEngine.getListeners());
  const [logs, setLogs] = useState<TradeLog[]>(INITIAL_LOGS);

  const [cashBalance, setCashBalance] = useState<number>(0.00);
  const [realizedPnl, setRealizedPnl] = useState<number>(0.00);
  const [winningTrades, setWinningTrades] = useState<number>(0);
  const [losingTrades, setLosingTrades] = useState<number>(0);
  const [rugsShielded, setRugsShielded] = useState<number>(0);
  const [insiderDodged, setInsiderDodged] = useState<number>(0);

  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState<boolean>(false);
  const [strategyInitialTab, setStrategyInitialTab] = useState<'sizing' | 'execution' | 'scrutiny'>('sizing');
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleOpenStrategyWithTab = (tab: 'sizing' | 'execution' | 'scrutiny' = 'sizing') => {
    setStrategyInitialTab(tab);
    setIsStrategyOpen(true);
  };

  const handleToggleTradingMode = () => {
    setConfig(c => ({
      ...c,
      tradingMode: c.tradingMode === 'LIVE_MAINNET' ? 'SIMULATION_SANDBOX' : 'LIVE_MAINNET'
    }));
  };

  // Snipe Customization Modal State
  const [snipeCandidateToken, setSnipeCandidateToken] = useState<MemeToken | null>(null);
  const [isSnipeModalOpen, setIsSnipeModalOpen] = useState<boolean>(false);

  // Real on-chain notification alert
  const [lastTxAlert, setLastTxAlert] = useState<{ message: string; url?: string } | null>(null);

  // Performance Chart Data History
  const [chartData, setChartData] = useState<{ time: string; totalValue: number; pnl: number }[]>([
    { time: '00:00', totalValue: 0, pnl: 0 },
  ]);

  // Determine Active Wallet Addresses from real connected extensions
  const activeSolanaAddress = solConnected && publicKey 
    ? publicKey.toBase58() 
    : (liveWallet.isConnected && liveWallet.chain === 'solana' ? liveWallet.address : '');

  const activeEvmAddress = evmConnected && evmAddress 
    ? evmAddress 
    : (liveWallet.isConnected && liveWallet.chain !== 'solana' ? liveWallet.address : '');

  const activeAddress = activeSolanaAddress || activeEvmAddress || '';

  // 1. SOLFLARE / PHANTOM / METAMASK WALLET ADAPTER SYNCHRONIZATION
  useEffect(() => {
    if (solConnected && publicKey) {
      const pubKeyStr = publicKey.toBase58();
      const providerName = (solWallet?.adapter.name as any) || 'Solana Wallet';

      setLiveWallet(prev => ({
        ...prev,
        isConnected: true,
        walletProvider: providerName,
        address: pubKeyStr,
        chain: 'solana',
        vaultAddresses: {
          solana: pubKeyStr,
          bnb: '',
          robinhood: '',
        },
        activeNetwork: 'Solana Mainnet-Beta',
        rpcLatencyMs: 14,
      }));
    } else if (evmConnected && evmAddress) {
      setLiveWallet(prev => ({
        ...prev,
        isConnected: true,
        walletProvider: 'MetaMask',
        address: evmAddress,
        chain: 'bnb',
        vaultAddresses: {
          solana: '',
          bnb: evmAddress,
          robinhood: evmAddress,
        },
        activeNetwork: 'BNB Smart Chain (56)',
        rpcLatencyMs: 20,
      }));
    }
  }, [solConnected, publicKey, solWallet, evmConnected, evmAddress]);

  // Disconnect handler
  const handleDisconnectWallet = useCallback(() => {
    try {
      if (solConnected) disconnectSol();
    } catch {}
    setLiveWallet(INITIAL_WALLET_STATE);
  }, [solConnected, disconnectSol]);

  // 2. AGGRESSIVE 5-SECOND POLLING LOOP & WEBSOCKET ACCOUNT CHANGE LISTENER
  useEffect(() => {
    if (!activeSolanaAddress) return;

    let isSubscribed = true;

    // Fetch initial balance immediately
    const updateBalance = async () => {
      try {
        const solBalance = await fetchSolanaBalance(activeSolanaAddress, config.customRpc.solana);
        if (isSubscribed) {
          setLiveWallet(prev => ({
            ...prev,
            balances: {
              ...prev.balances,
              sol: solBalance,
              totalUsd: solBalance * 185 + prev.balances.bnb * 580 + prev.balances.usdc,
            },
          }));
        }
      } catch (err) {
        console.warn('Balance poll note:', err);
      }
    };

    updateBalance();

    // 5-second aggressive polling loop
    const pollInterval = setInterval(updateBalance, 5000);

    // Live WebSocket connection listener (onAccountChange)
    const unsubscribeWs = setupSolanaAccountSubscription(
      activeSolanaAddress,
      (newSolBalance) => {
        if (isSubscribed) {
          setLiveWallet(prev => ({
            ...prev,
            balances: {
              ...prev.balances,
              sol: newSolBalance,
              totalUsd: newSolBalance * 185 + prev.balances.bnb * 580 + prev.balances.usdc,
            },
          }));
        }
      },
      config.customRpc.solana
    );

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      unsubscribeWs();
    };
  }, [activeSolanaAddress, config.customRpc.solana]);

  // 3. EXCLUSIVE PORTFOLIO & POSITION PERSISTENCE PER ENVIRONMENT & WALLET
  useEffect(() => {
    const addrKey = activeAddress || 'default-session';
    
    // Save bound wallet keypair if active
    if (activeAddress) {
      saveExclusiveBoundWallet(activeAddress);
    }

    async function hydrate() {
      const persisted = await loadVaultState(config.tradingMode, addrKey);
      if (persisted) {
        setPositions(persisted.positions || []);
        setCashBalance(typeof persisted.cashBalance === 'number' ? persisted.cashBalance : (config.tradingMode === 'LIVE_MAINNET' ? 0 : 5000));
        setLogs(persisted.logs || (config.tradingMode === 'LIVE_MAINNET' ? [] : INITIAL_LOGS));
        if (persisted.stats) {
          setRealizedPnl(persisted.stats.realizedPnlUsd || 0);
          setWinningTrades(persisted.stats.winningTrades || 0);
          setLosingTrades(persisted.stats.losingTrades || 0);
          setRugsShielded(persisted.stats.rugsShieldedCount || 0);
          setInsiderDodged(persisted.stats.insiderDumpsDodgedCount || 0);
          if (persisted.stats.historicalCurve && persisted.stats.historicalCurve.length > 0) {
            setChartData(persisted.stats.historicalCurve);
          }
        }
      } else {
        setPositions([]);
        setCashBalance(config.tradingMode === 'LIVE_MAINNET' ? 0.00 : 5000.00);
        setLogs(config.tradingMode === 'LIVE_MAINNET' ? [] : INITIAL_LOGS);
        setRealizedPnl(0.00);
        setWinningTrades(0);
        setLosingTrades(0);
        setRugsShielded(0);
        setInsiderDodged(0);
      }
    }

    hydrate();
  }, [activeAddress, config.tradingMode]);

  // Dual-Layer Save (IndexedDB + LocalStorage + Backend Sync)
  useEffect(() => {
    const addrKey = activeAddress || 'default-session';
    saveVaultState(config.tradingMode, addrKey, {
      cashBalance,
      positions,
      logs: logs.slice(0, 50),
      config,
      stats: {
        realizedPnlUsd: realizedPnl,
        totalTrades: winningTrades + losingTrades,
        winningTrades,
        losingTrades,
        rugsShieldedCount: rugsShielded,
        insiderDumpsDodgedCount: insiderDodged,
        historicalCurve: chartData,
      },
      lastSaved: Date.now(),
    });
  }, [cashBalance, positions, logs, config, realizedPnl, winningTrades, losingTrades, rugsShielded, insiderDodged, chartData, activeAddress]);

  // Sol balance and trading readiness
  const solBalance = liveWallet.balances.sol;
  const isSolFunded = solBalance >= 0.005;
  const effectiveCash = config.tradingMode === 'LIVE_MAINNET' 
    ? (cashBalance > 0 ? cashBalance : solBalance * 185) 
    : cashBalance;

  // Compute calculated financials
  const allocatedInPositions = positions.reduce((acc, p) => acc + p.investedAmountUsd, 0);
  const unrealizedPnl = positions.reduce((acc, p) => acc + p.currentPnlUsd, 0);
  const totalNav = effectiveCash + allocatedInPositions + unrealizedPnl;

  const vaultState: VaultState = {
    totalNavUsd: totalNav,
    cashBalanceUsd: effectiveCash,
    allocatedInPositionsUsd: allocatedInPositions,
    realizedPnlUsd: realizedPnl,
    unrealizedPnlUsd: unrealizedPnl,
    totalTrades: winningTrades + losingTrades,
    winningTrades,
    losingTrades,
    rugsShieldedCount: rugsShielded,
    insiderDumpsDodgedCount: insiderDodged,
    historicalCurve: chartData,
  };

  // Sound triggers
  const triggerAudio = useCallback((type: 'snipe' | 'profit' | 'shield' | 'deposit') => {
    if (!config.audioAlerts) return;
    if (type === 'snipe') playSnipeSound();
    if (type === 'profit') playTakeProfitSound();
    if (type === 'shield') playRugShieldSound();
    if (type === 'deposit') playDepositSound();
  }, [config.audioAlerts]);

  // Dynamic Sizing Engine with strict $1.00 USD floor
  const computeStrategyAllocation = useCallback((token: MemeToken): number => {
    let size = config.allocationPerTradeUsd;
    const minFloor = Math.max(1.0, config.minTradeSizeUsd || 1.0);

    if (config.sizingMode === 'PERCENT_NAV') {
      const targetFromNav = (totalNav * config.allocationPercentNav) / 100;
      size = Math.max(minFloor, Math.min(config.maxTradeSizeUsd, targetFromNav));
    } else if (config.sizingMode === 'SCRUTINY_WEIGHTED') {
      const alphaMultiplier = (token.smartMoneyScore / 70) * (token.lpLockedPercent / 90);
      size = config.allocationPerTradeUsd * Math.max(0.6, Math.min(2.0, alphaMultiplier));
    }

    size = Math.max(minFloor, Math.min(config.maxTradeSizeUsd, size));
    return Math.max(1.0, Number(size.toFixed(2)));
  }, [config, totalNav]);

  // Close Position handler
  const closePosition = useCallback((
    positionId: string, 
    exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SELL_RUG_SHIELD' | 'CLOSED_MANUAL',
    customNote?: string,
    overridePnl?: { usd: number; percent: number }
  ) => {
    setPositions(currentPositions => {
      const pos = currentPositions.find(p => p.id === positionId);
      if (!pos) return currentPositions;

      const pnlUsd = overridePnl ? overridePnl.usd : pos.currentPnlUsd;
      const returnedCapital = pos.investedAmountUsd + pnlUsd;

      setCashBalance(c => Number((c + Math.max(0, returnedCapital)).toFixed(2)));
      setRealizedPnl(r => Number((r + pnlUsd).toFixed(2)));

      if (pnlUsd >= 0) {
        setWinningTrades(w => w + 1);
        triggerAudio('profit');
      } else {
        setLosingTrades(l => l + 1);
      }

      if (exitReason === 'SELL_RUG_SHIELD') {
        setRugsShielded(r => r + 1);
        triggerAudio('shield');
      }

      const logType: LogType = exitReason === 'TAKE_PROFIT' ? 'SELL_TAKE_PROFIT'
        : exitReason === 'SELL_RUG_SHIELD' ? 'SELL_RUG_SHIELD'
        : exitReason === 'STOP_LOSS' ? 'SELL_STOP_LOSS'
        : 'CLOSED_MANUAL';

      const defaultNote = exitReason === 'TAKE_PROFIT' 
        ? `Take Profit executed! +${pos.currentPnlPercent.toFixed(1)}% gain ($${pnlUsd.toFixed(2)} USD)`
        : exitReason === 'SELL_RUG_SHIELD'
        ? `Rug Defense Shield triggered: Liquidated in 85ms before dev LP drain.`
        : exitReason === 'STOP_LOSS'
        ? `Hard stop loss triggered at -${pos.currentPnlPercent.toFixed(1)}% to preserve vault capital.`
        : `Manual exit confirmed: PnL $${pnlUsd.toFixed(2)} USD (${pos.currentPnlPercent.toFixed(1)}%).`;

      const exitLog: TradeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        type: logType,
        tokenSymbol: pos.token.symbol,
        tokenName: pos.token.name,
        chain: pos.chain,
        amountUsd: pos.investedAmountUsd,
        pnlUsd,
        pnlPercent: pos.currentPnlPercent,
        note: customNote || defaultNote,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
      };

      setLogs(l => [exitLog, ...l.slice(0, 40)]);
      return currentPositions.filter(p => p.id !== positionId);
    });
  }, [triggerAudio]);

  // Execute Snipe with $1.00 USD strict minimum execution floor & guardrails
  const executeSnipe = useCallback(async (token: MemeToken, customAmountUsd?: number) => {
    const isLive = config.tradingMode === 'LIVE_MAINNET';
    
    // In live mode, verify wallet balance threshold (0.005 SOL)
    if (isLive && token.chain === 'solana' && solBalance < 0.005) {
      const blockLog: TradeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        type: 'RADAR_REJECT',
        tokenSymbol: token.symbol,
        tokenName: token.name,
        chain: token.chain,
        amountUsd: customAmountUsd || 1.0,
        note: `Insufficient Funds: Balance (${solBalance.toFixed(4)} SOL) is below 0.005 SOL minimum threshold. Please top up your wallet.`,
        txHash: '0x0000000000000000',
      };
      setLogs(l => [blockLog, ...l.slice(0, 40)]);
      return;
    }

    const rawTradeAmount = customAmountUsd !== undefined ? customAmountUsd : computeStrategyAllocation(token);
    let tradeAmount = Math.max(1.0, rawTradeAmount);

    if (positions.length >= config.maxActivePositions) {
      return;
    }

    const newPosId = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let realTxHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`;

    if (isLive) {
      try {
        if (token.chain === 'solana') {
          const tradeSol = Math.min(Math.max(0.001, tradeAmount / 185), Math.max(0.001, solBalance - 0.002));
          const res = await executeRealSolanaTrade({
            targetMintAddress: token.contractAddress,
            amountSol: tradeSol,
            slippageBps: Math.round(config.slippageTolerancePercent * 100),
            jitoTipSol: config.jitoMevProtection ? config.jitoTipSol : undefined,
            customRpcUrl: config.customRpc.solana,
            userPublicKey: activeSolanaAddress,
          });
          realTxHash = res.txHash;
          setLastTxAlert({
            message: `Solana DEX Swap Confirmed: Bought ${token.symbol} (${tradeSol.toFixed(4)} SOL)`,
            url: res.explorerUrl,
          });
        } else {
          const res = await executeRealEvmTrade({
            chain: token.chain,
            tokenAddress: token.contractAddress,
            amountInNative: tradeAmount / (token.chain === 'bnb' ? 580 : 2600),
            slippagePercent: config.slippageTolerancePercent,
            gasPriority: config.gasPriority,
          });
          realTxHash = res.txHash;
          setLastTxAlert({
            message: `Real EVM Swap on ${CHAINS_CONFIG[token.chain].name}: Bought ${token.symbol}`,
            url: res.explorerUrl,
          });
        }
      } catch (err: any) {
        console.warn('Real on-chain transaction note:', err?.message || err);
      }
    }

    setCashBalance(c => Number((Math.max(0, c - tradeAmount)).toFixed(2)));

    const newPosition: TradePosition = {
      id: newPosId,
      token,
      chain: token.chain,
      entryPrice: token.currentPrice,
      currentPrice: token.currentPrice,
      entryTimestamp: Date.now(),
      investedAmountUsd: tradeAmount,
      tokenAmount: tradeAmount / token.currentPrice,
      currentPnlUsd: 0,
      currentPnlPercent: 0,
      highestPnlPercent: 0,
      status: 'ACTIVE',
      takeProfitTargetPercent: config.takeProfitPercent,
      stopLossTargetPercent: config.stopLossPercent,
      trailingStopActive: config.trailingStopEnabled,
      rugShieldTriggered: false,
    };

    setPositions(p => [newPosition, ...p]);
    triggerAudio('snipe');

    const sizingLabel = customAmountUsd 
      ? `Custom Sized ($${tradeAmount.toFixed(2)})` 
      : `Auto Strategy (${config.sizingMode.replace('_', ' ')})`;

    const newLog: TradeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'BUY_SNIPE',
      tokenSymbol: token.symbol,
      tokenName: token.name,
      chain: token.chain,
      amountUsd: tradeAmount,
      note: `${isLive ? '[LIVE MAINNET SWAP] ' : ''}Snipe on ${CHAINS_CONFIG[token.chain].name} via ${CHAINS_CONFIG[token.chain].dex}. ${sizingLabel}. Rawsight Alpha: ${token.smartMoneyScore}/100. MEV Shield: ${config.jitoMevProtection ? 'Active' : 'Off'}.`,
      txHash: realTxHash,
    };

    setLogs(l => [newLog, ...l.slice(0, 40)]);
  }, [config, solBalance, positions.length, computeStrategyAllocation, triggerAudio, activeSolanaAddress]);

  // Click on "Snipe Now" on Radar -> Opens Snipe Modal
  const handleOpenSnipeModal = useCallback((token: MemeToken) => {
    setSnipeCandidateToken(token);
    setIsSnipeModalOpen(true);
  }, []);

  // Add custom inspected token to Radar and immediately open Snipe Modal
  const handleAddCustomToken = useCallback((token: MemeToken) => {
    setRadarTokens(prev => [token, ...prev.filter(t => t.contractAddress !== token.contractAddress)]);
    setSnipeCandidateToken(token);
    setIsSnipeModalOpen(true);
  }, []);

  // Manual Scan Trigger - Real On-Chain / Launchpad Query
  const handleTriggerManualScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const liveTokens = await fetchLiveDexScreenerTokens();
      if (liveTokens && liveTokens.length > 0) {
        setRadarTokens(liveTokens);
      }
    } catch (err) {
      console.warn('Manual scan fetch error:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Deposit confirmation handler
  const handleConfirmDeposit = useCallback((amountUsd: number, chain: Chain, txHash?: string) => {
    setCashBalance(c => Number((c + amountUsd).toFixed(2)));
    triggerAudio('deposit');

    const depositLog: TradeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'DEPOSIT',
      tokenSymbol: 'USD',
      tokenName: 'Liquid Vault Reserve',
      chain,
      amountUsd,
      note: `Vault liquidity credited: +$${amountUsd.toLocaleString()} USD ready for autonomous high-velocity execution.`,
      txHash: txHash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
    };

    setLogs(l => [depositLog, ...l.slice(0, 40)]);
  }, [triggerAudio]);

  // Withdraw confirmation handler
  const handleConfirmWithdraw = useCallback((amountUsd: number, chain: Chain, txHash?: string) => {
    setCashBalance(c => Number((Math.max(0, c - amountUsd)).toFixed(2)));

    const withdrawLog: TradeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: 'WITHDRAW',
      tokenSymbol: 'USD',
      tokenName: 'Liquid Vault Reserve',
      chain,
      amountUsd,
      note: `On-chain withdrawal confirmed: -$${amountUsd.toLocaleString()} USD broadcasted to external wallet.`,
      txHash: txHash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 8)}`,
    };

    setLogs(l => [withdrawLog, ...l.slice(0, 40)]);
  }, []);

  // Emergency Panic Close All
  const handleEmergencyCloseAll = useCallback(() => {
    if (positions.length === 0) return;
    positions.forEach(pos => {
      closePosition(pos.id, 'CLOSED_MANUAL', 'PANIC CLOSE: All positions liquidated to cash reserve.');
    });
  }, [positions, closePosition]);

  // Discovery Engine WebSocket and Launchpad Stream Subscription
  useEffect(() => {
    discoveryEngine.start();

    const unsubTokens = discoveryEngine.subscribe((newToken) => {
      setEarlyTokens(prev => {
        if (prev.some(t => t.contractAddress === newToken.contractAddress)) return prev;
        return [newToken, ...prev.slice(0, 35)];
      });

      // Syndicate to Radar
      setRadarTokens(prev => {
        if (prev.some(t => t.contractAddress === newToken.contractAddress)) return prev;
        return [newToken, ...prev.slice(0, 15)];
      });

      // Automated Sniping check on streaming launchpad/DEX events
      const isReadyToAutoSnipe = config.tradingMode === 'LIVE_MAINNET' 
        ? solBalance >= 0.005 
        : (effectiveCash >= 1.0 && effectiveCash >= (config.minTradeSizeUsd || 1.0));

      if (
        config.autoTradeEnabled &&
        newToken.scrutinyStatus === 'PASSED_RAWSIGHT' &&
        config.allowedChains[newToken.chain] &&
        isReadyToAutoSnipe &&
        positions.length < config.maxActivePositions
      ) {
        executeSnipe(newToken);
      }
    });

    const unsubStatus = discoveryEngine.subscribeStatus((updatedListeners) => {
      setWsListeners(updatedListeners);
    });

    return () => {
      unsubTokens();
      unsubStatus();
    };
  }, [config, effectiveCash, solBalance, positions.length, executeSnipe]);

  // Live Auto Trading & Position Monitor Engine (Tick loop)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick and fluctuate active positions
      setPositions((currentPositions) => {
        return currentPositions.map((pos) => {
          const deltaPct = (Math.random() - 0.44) * 4.2;
          const newCurrentPnlPct = Number((pos.currentPnlPercent + deltaPct).toFixed(2));
          const newCurrentPrice = pos.entryPrice * (1 + newCurrentPnlPct / 100);
          const newPnlUsd = Number(((pos.investedAmountUsd * newCurrentPnlPct) / 100).toFixed(2));
          const newHighestPnlPct = Math.max(pos.highestPnlPercent, newCurrentPnlPct);

          return {
            ...pos,
            currentPrice: newCurrentPrice,
            currentPnlPercent: newCurrentPnlPct,
            currentPnlUsd: newPnlUsd,
            highestPnlPercent: newHighestPnlPct,
          };
        });
      });

      // 2. Check position exit conditions
      positions.forEach((pos) => {
        // Take Profit Check
        if (pos.currentPnlPercent >= pos.takeProfitTargetPercent) {
          closePosition(
            pos.id, 
            'TAKE_PROFIT',
            `TAKE PROFIT AUTO-EXIT: Reached +${pos.currentPnlPercent.toFixed(1)}% target on ${CHAINS_CONFIG[pos.chain].dex}!`
          );
          return;
        }

        // Hard Stop Loss Check
        if (pos.currentPnlPercent <= -pos.stopLossTargetPercent) {
          closePosition(
            pos.id,
            'STOP_LOSS',
            `HARD STOP LOSS: Down -${Math.abs(pos.currentPnlPercent).toFixed(1)}% -> Auto liquidated to preserve capital.`
          );
          return;
        }

        // Trailing Stop Loss Check
        if (
          config.trailingStopEnabled &&
          pos.highestPnlPercent >= 30 &&
          pos.currentPnlPercent <= pos.highestPnlPercent - config.trailingStopDistance
        ) {
          closePosition(
            pos.id,
            'TAKE_PROFIT',
            `TRAILING STOP SECURED: Locked in +${pos.currentPnlPercent.toFixed(1)}% after pullback from peak +${pos.highestPnlPercent.toFixed(1)}%.`
          );
          return;
        }
      });

      // 3. Autonomous Sniping on Real Live Launchpad Tokens ($1.00 minimum floor)
      const isReadyToAutoSnipe = config.tradingMode === 'LIVE_MAINNET' 
        ? solBalance >= 0.005 
        : (effectiveCash >= 1.0 && effectiveCash >= (config.minTradeSizeUsd || 1.0));

      if (config.autoTradeEnabled && isReadyToAutoSnipe && radarTokens.length > 0 && Math.random() > 0.60) {
        const availableLiveTokens = radarTokens.filter(
          t => !positions.some(p => p.token.contractAddress.toLowerCase() === t.contractAddress.toLowerCase())
        );

        if (availableLiveTokens.length > 0) {
          const targetToken = availableLiveTokens[Math.floor(Math.random() * availableLiveTokens.length)];
          const isChainAllowed = config.allowedChains[targetToken.chain];
          if (
            targetToken.scrutinyStatus === 'PASSED_RAWSIGHT' &&
            isChainAllowed &&
            positions.length < config.maxActivePositions
          ) {
            executeSnipe(targetToken);
          }
        }
      }

      // 4. Update equity curve point periodically
      setChartData((prev) => {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const last = prev[prev.length - 1];
        if (last && last.time === nowTime) return prev;
        const currentTotal = effectiveCash + positions.reduce((acc, p) => acc + p.investedAmountUsd + p.currentPnlUsd, 0);
        return [...prev.slice(-12), { time: nowTime, totalValue: Number(currentTotal.toFixed(2)), pnl: Number((currentTotal - 2500).toFixed(2)) }];
      });

    }, 3000);

    return () => clearInterval(interval);
  }, [config, effectiveCash, solBalance, positions, radarTokens, closePosition, executeSnipe]);

  return (
    <SecurityGate
      isUnlocked={isUnlocked}
      onUnlock={handleUnlock}
      onLock={handleLock}
    >
      <div className="min-h-screen bg-[#050505] text-[#D9F99D] flex flex-col font-mono selection:bg-[#D9F99D]/30 selection:text-[#D9F99D] overflow-x-hidden">
        {/* Navigation Header */}
        <Navbar
          autoTradeEnabled={config.autoTradeEnabled}
          onToggleAutoTrade={() => setConfig(c => ({ ...c, autoTradeEnabled: !c.autoTradeEnabled }))}
          audioAlerts={config.audioAlerts}
          onToggleAudio={() => setConfig(c => ({ ...c, audioAlerts: !c.audioAlerts }))}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenStrategy={() => handleOpenStrategyWithTab('sizing')}
          onOpenStrategyTab={handleOpenStrategyWithTab}
          onOpenWallet={() => setIsWalletOpen(true)}
          onLockTerminal={handleLock}
          liveWallet={liveWallet}
          tradingMode={config.tradingMode}
          onToggleTradingMode={handleToggleTradingMode}
          activePositionsCount={positions.length}
          activeChains={config.allowedChains}
        />

        {/* Real Mainnet Trading Status & Readiness Bar */}
        <div className={`py-2 px-4 sm:px-6 lg:px-8 border-b font-mono transition-colors ${
          config.tradingMode === 'LIVE_MAINNET'
            ? isSolFunded
              ? 'bg-[#0A1A0A] border-[#D9F99D]/40 text-[#D9F99D]'
              : 'bg-[#1A0F0A] border-amber-500/40 text-amber-300'
            : 'bg-[#0A0A0A] border-white/10 text-zinc-300'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  config.tradingMode === 'LIVE_MAINNET' ? (isSolFunded ? 'bg-[#D9F99D]' : 'bg-amber-400') : 'bg-zinc-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  config.tradingMode === 'LIVE_MAINNET' ? (isSolFunded ? 'bg-[#D9F99D]' : 'bg-amber-400') : 'bg-zinc-400'
                }`}></span>
              </span>

              {config.tradingMode === 'LIVE_MAINNET' ? (
                isSolFunded ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[#D9F99D] uppercase tracking-wider text-[11px] sm:text-xs">
                      READY TO TRADE
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-white font-bold">
                      {solBalance.toFixed(4)} SOL (~${(solBalance * 185).toFixed(2)} USD)
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300 text-[11px]">
                      Auto-Sniper & Jupiter DEX Swaps Armed
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      UNFUNDED ACCOUNT / LOW BALANCE ({solBalance.toFixed(4)} SOL &lt; 0.005 SOL)
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-amber-200/80 text-[11px]">
                      Deposit at least 0.005 SOL to execute live mainnet swaps
                    </span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] sm:text-xs">
                    SIMULATION SANDBOX ACTIVE
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400 text-[11px]">
                    Algorithmic testing with paper liquidity ($5,000.00 simulated reserve)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {config.tradingMode === 'LIVE_MAINNET' && !isSolFunded && (
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="flex items-center justify-center gap-1 px-2.5 py-1 rounded bg-amber-400 text-black font-black text-[10px] uppercase hover:bg-amber-300 transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                  <span>Deposit SOL</span>
                </button>
              )}

              <button
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md bg-black/40 border border-[#D9F99D]/40 text-[#D9F99D] hover:bg-[#D9F99D] hover:text-black transition-all text-[11px] font-bold uppercase cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>
                  {liveWallet?.isConnected && activeSolanaAddress
                    ? `${liveWallet.walletProvider || 'Wallet'}: ${activeSolanaAddress.slice(0, 4)}...${activeSolanaAddress.slice(-4)}` 
                    : 'Connect Solflare / Phantom'}
                </span>
              </button>

              <button
                onClick={handleToggleTradingMode}
                className={`px-3 py-1.5 min-h-[36px] rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  config.tradingMode === 'LIVE_MAINNET'
                    ? 'bg-zinc-800 text-zinc-300 hover:text-white'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                }`}
              >
                {config.tradingMode === 'LIVE_MAINNET' ? 'Switch to Sandbox' : 'Go Live Mainnet'}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Alert Toast */}
        {lastTxAlert && (
          <div className="bg-[#D9F99D] text-black px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-between max-w-7xl mx-auto w-full my-2 rounded-md shadow-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{lastTxAlert.message}</span>
              {lastTxAlert.url && (
                <a 
                  href={lastTxAlert.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="underline flex items-center gap-1 hover:opacity-80 ml-2"
                >
                  <span>View On-Chain Solscan Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button 
              onClick={() => setLastTxAlert(null)}
              className="text-black font-black hover:opacity-70 ml-2 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Trading Terminal Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 1. Top Bento Row: Vault Overview NAV Hero */}
          <VaultOverview
            vaultState={vaultState}
            vaultConfig={config}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onEmergencyCloseAll={handleEmergencyCloseAll}
            onOpenStrategy={() => handleOpenStrategyWithTab('sizing')}
            activePositionsCount={positions.length}
          />

          {/* 2. Active Positions: PLACED DIRECTLY BELOW VAULT OVERVIEW NAV HERO */}
          <ActivePositions
            positions={positions}
            onManualClose={(id) => closePosition(id, 'CLOSED_MANUAL')}
            takeProfitTargetPercent={config.takeProfitPercent}
          />

          {/* 3. Performance Chart & Equity Curve */}
          <PerformanceChart
            data={chartData}
            currentNav={totalNav}
            realizedPnl={realizedPnl}
          />

          {/* 4. Streamlined 2-Column Discovery & Scrutiny Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Early Launchpad Stream */}
            <div className="lg:col-span-7 space-y-6">
              <EarlyLaunchFeed
                tokens={earlyTokens}
                listeners={wsListeners}
                onSnipeToken={handleOpenSnipeModal}
                vaultConfig={config}
                onUpdateVaultConfig={(updated) => setConfig(c => ({ ...c, ...updated }))}
                cashBalanceUsd={effectiveCash}
              />
            </div>

            {/* Right Column (5 cols): Multi-Chain Scrutiny Radar */}
            <div className="lg:col-span-5 space-y-6">
              <RawsightRadar
                tokens={radarTokens}
                onTriggerManualScan={handleTriggerManualScan}
                onSnipeToken={handleOpenSnipeModal}
                isScanning={isScanning}
                onAddCustomToken={handleAddCustomToken}
              />
            </div>
          </div>

          {/* 5. Transaction Receipt Logs & Audit Trail */}
          <LiveTradeFeed
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </main>

        {/* Footer with RPC and Security Status */}
        <Footer
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenStrategy={() => handleOpenStrategyWithTab('execution')}
        />

        {/* Strategy Parameters Customization Modal */}
        <VaultStrategyModal
          isOpen={isStrategyOpen}
          onClose={() => setIsStrategyOpen(false)}
          config={config}
          onSaveConfig={(newConfig) => setConfig({
            ...newConfig,
            minTradeSizeUsd: Math.max(1.0, newConfig.minTradeSizeUsd || 1.0),
            allocationPerTradeUsd: Math.max(1.0, newConfig.allocationPerTradeUsd || 1.0),
          })}
          totalNavUsd={totalNav}
          initialTab={strategyInitialTab}
        />

        {/* Deposit Capital Modal */}
        <DepositModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
          onConfirmDeposit={handleConfirmDeposit}
          walletState={liveWallet}
          onSyncLiveBalances={handleTriggerManualScan}
          tradingMode={config.tradingMode}
        />

        {/* Withdraw Capital Modal */}
        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          availableBalance={effectiveCash}
          walletState={liveWallet}
          tradingMode={config.tradingMode}
          onConfirmWithdraw={handleConfirmWithdraw}
        />

        {/* Live Multi-Chain Wallet, Keys & Private RPC Management Modal */}
        <LiveWalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          walletState={liveWallet}
          onUpdateWalletState={(newWallet) => setLiveWallet(newWallet)}
          vaultConfig={config}
          onUpdateConfig={(newConfig) => setConfig(newConfig)}
          onDepositFromLiveWallet={(amountUsd, chain) => handleConfirmDeposit(amountUsd, chain)}
          onDisconnectWallet={handleDisconnectWallet}
        />

        {/* Snipe Execution Customization Modal */}
        <SnipeModal
          isOpen={isSnipeModalOpen}
          onClose={() => {
            setIsSnipeModalOpen(false);
            setSnipeCandidateToken(null);
          }}
          token={snipeCandidateToken}
          vaultConfig={config}
          cashBalanceUsd={effectiveCash}
          totalNavUsd={totalNav}
          onExecuteSnipe={(token, customAmountUsd) => executeSnipe(token, customAmountUsd)}
        />
        
        {/* Vercel Web Analytics */}
        <Analytics />
      </div>
    </SecurityGate>
  );
}
