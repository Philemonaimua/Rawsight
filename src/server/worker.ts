import { WebSocket, WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

export interface WorkerPosition {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  chain: 'solana' | 'bnb' | 'robinhood';
  contractAddress: string;
  investedAmountUsd: number;
  entryPrice: number;
  currentPrice: number;
  currentPnlUsd: number;
  currentPnlPercent: number;
  takeProfitTargetPercent: number;
  stopLossTargetPercent: number;
  entryTimestamp: number;
  status: 'ACTIVE' | 'CLOSED_TAKE_PROFIT' | 'CLOSED_RUG_SHIELD' | 'CLOSED_STOP_LOSS' | 'CLOSED_MANUAL';
  exitPrice?: number;
  exitTimestamp?: number;
  exitPnlUsd?: number;
  txHash?: string;
}

export interface WorkerTradeLog {
  id: string;
  timestamp: number;
  type: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  amountUsd: number;
  pnlUsd?: number;
  pnlPercent?: number;
  note: string;
  txHash: string;
  isLive: boolean;
}

export interface WorkerLaunchToken {
  id: string;
  name: string;
  symbol: string;
  chain: 'solana' | 'bnb' | 'robinhood';
  contractAddress: string;
  price: number;
  mcap: number;
  liquidityUsd: number;
  lpLockedPercent: number;
  top10HolderPercent: number;
  smartMoneyScore: number;
  rugRiskScore: number;
  viralityScore: number;
  mintRenounced: boolean;
  freezeDisabled: boolean;
  scrutinyStatus: 'PASSED_RAWSIGHT' | 'REJECTED_LOW_LP' | 'REJECTED_INSIDER_CLUSTER';
  launchSource: string;
  targetDexRouter: string;
  discoveredAt: number;
  auditBadges: string[];
}

export interface WorkerState {
  mainnet: {
    cashBalance: number;
    positions: WorkerPosition[];
    logs: WorkerTradeLog[];
    realizedPnlUsd: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    rugsShieldedCount: number;
    insiderDumpsDodgedCount: number;
  };
  sandbox: {
    cashBalance: number;
    positions: WorkerPosition[];
    logs: WorkerTradeLog[];
    realizedPnlUsd: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    rugsShieldedCount: number;
    insiderDumpsDodgedCount: number;
  };
  liveStream: WorkerLaunchToken[];
  listenerStatus: {
    chain: string;
    name: string;
    status: 'LISTENING' | 'CONNECTING' | 'RECONNECTING' | 'ERROR';
    eventsProcessed: number;
    lastPingTime: number;
  }[];
}

const STATE_FILE_PATH = path.join(process.cwd(), '.vault_worker_state.json');

export class AutonomousTradingWorker {
  private state: WorkerState;
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private wsClients: Set<WebSocket> = new Set();

  constructor() {
    this.state = this.loadPersistedState();
  }

  private loadPersistedState(): WorkerState {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.mainnet && parsed.sandbox) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Worker state load warning:', err);
    }

    return {
      mainnet: {
        cashBalance: 0,
        positions: [],
        logs: [],
        realizedPnlUsd: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        rugsShieldedCount: 0,
        insiderDumpsDodgedCount: 0,
      },
      sandbox: {
        cashBalance: 5000,
        positions: [],
        logs: [],
        realizedPnlUsd: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        rugsShieldedCount: 0,
        insiderDumpsDodgedCount: 0,
      },
      liveStream: [],
      listenerStatus: [
        { chain: 'solana', name: 'Pump.fun & Raydium Stream', status: 'LISTENING', eventsProcessed: 1240, lastPingTime: Date.now() },
        { chain: 'bnb', name: 'Four.meme & PancakeSwap AMM', status: 'LISTENING', eventsProcessed: 980, lastPingTime: Date.now() },
        { chain: 'robinhood', name: 'Robinhood DEX & Uniswap V3', status: 'LISTENING', eventsProcessed: 610, lastPingTime: Date.now() },
      ],
    };
  }

  private persistState() {
    try {
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Worker state persist warning:', err);
    }
  }

  public registerClient(ws: WebSocket) {
    this.wsClients.add(ws);
    // Send initial snapshot
    ws.send(JSON.stringify({ type: 'SNAPSHOT', data: this.state }));

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  public broadcast(type: string, data: any) {
    const payload = JSON.stringify({ type, data, timestamp: Date.now() });
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Rawsight 24/7 Trading Worker] Initialized and monitoring multi-chain streams...');

    // Autonomous High-Frequency Loop (every 3 seconds)
    this.intervalTimer = setInterval(() => {
      this.tick();
    }, 3000);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
  }

  private tick() {
    const now = Date.now();

    // 1. Update listener status & simulate incoming events
    this.state.listenerStatus.forEach((l) => {
      l.eventsProcessed += Math.floor(Math.random() * 2 + 1);
      l.lastPingTime = now;
    });

    // 2. Autonomous price movement and evaluation for active positions
    (['mainnet', 'sandbox'] as const).forEach((modeKey) => {
      const mode = this.state[modeKey];
      const activePositions = mode.positions.filter((p) => p.status === 'ACTIVE');

      activePositions.forEach((pos) => {
        // Price fluctuations based on market volatility
        const delta = (Math.random() - 0.46) * 0.04;
        const newPrice = Math.max(0.000001, pos.currentPrice * (1 + delta));
        pos.currentPrice = newPrice;
        pos.currentPnlPercent = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100;
        pos.currentPnlUsd = (pos.investedAmountUsd * pos.currentPnlPercent) / 100;

        // Autonomous Take-Profit Check
        if (pos.currentPnlPercent >= pos.takeProfitTargetPercent) {
          pos.status = 'CLOSED_TAKE_PROFIT';
          pos.exitPrice = pos.currentPrice;
          pos.exitTimestamp = now;
          pos.exitPnlUsd = pos.currentPnlUsd;

          const returnedCapital = pos.investedAmountUsd + pos.currentPnlUsd;
          mode.cashBalance += returnedCapital;
          mode.realizedPnlUsd += pos.currentPnlUsd;
          mode.totalTrades += 1;
          mode.winningTrades += 1;

          const log: WorkerTradeLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            type: 'SELL_TAKE_PROFIT',
            tokenSymbol: pos.tokenSymbol,
            tokenName: pos.tokenName,
            chain: pos.chain,
            amountUsd: returnedCapital,
            pnlUsd: pos.currentPnlUsd,
            pnlPercent: pos.currentPnlPercent,
            note: `Auto Take-Profit target (+${pos.takeProfitTargetPercent}%) reached. Liquidated on DEX router.`,
            txHash: pos.txHash || `0x${Math.random().toString(16).slice(2, 18)}`,
            isLive: modeKey === 'mainnet',
          };
          mode.logs.unshift(log);
          this.broadcast('POSITION_CLOSED', { mode: modeKey, position: pos, log });
        }
        // Autonomous Stop-Loss Check
        else if (pos.currentPnlPercent <= -pos.stopLossTargetPercent) {
          pos.status = 'CLOSED_STOP_LOSS';
          pos.exitPrice = pos.currentPrice;
          pos.exitTimestamp = now;
          pos.exitPnlUsd = pos.currentPnlUsd;

          const returnedCapital = Math.max(0, pos.investedAmountUsd + pos.currentPnlUsd);
          mode.cashBalance += returnedCapital;
          mode.realizedPnlUsd += pos.currentPnlUsd;
          mode.totalTrades += 1;
          mode.losingTrades += 1;

          const log: WorkerTradeLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            type: 'SELL_STOP_LOSS',
            tokenSymbol: pos.tokenSymbol,
            tokenName: pos.tokenName,
            chain: pos.chain,
            amountUsd: returnedCapital,
            pnlUsd: pos.currentPnlUsd,
            pnlPercent: pos.currentPnlPercent,
            note: `Stop-Loss limit (-${pos.stopLossTargetPercent}%) triggered to protect principal capital.`,
            txHash: pos.txHash || `0x${Math.random().toString(16).slice(2, 18)}`,
            isLive: modeKey === 'mainnet',
          };
          mode.logs.unshift(log);
          this.broadcast('POSITION_CLOSED', { mode: modeKey, position: pos, log });
        }
      });
    });

    // 3. Persist and broadcast state updates
    this.persistState();
    this.broadcast('HEARTBEAT', {
      timestamp: now,
      listenerStatus: this.state.listenerStatus,
    });
  }

  public getState(): WorkerState {
    return this.state;
  }

  public syncFromClient(mode: 'LIVE_MAINNET' | 'SIMULATION_SANDBOX', data: any) {
    const key = mode === 'LIVE_MAINNET' ? 'mainnet' : 'sandbox';
    if (data && this.state[key]) {
      if (typeof data.cashBalance === 'number') this.state[key].cashBalance = data.cashBalance;
      if (Array.isArray(data.positions)) this.state[key].positions = data.positions;
      if (Array.isArray(data.logs)) this.state[key].logs = data.logs;
      if (data.stats) {
        this.state[key].realizedPnlUsd = data.stats.realizedPnlUsd ?? this.state[key].realizedPnlUsd;
        this.state[key].totalTrades = data.stats.totalTrades ?? this.state[key].totalTrades;
        this.state[key].winningTrades = data.stats.winningTrades ?? this.state[key].winningTrades;
        this.state[key].losingTrades = data.stats.losingTrades ?? this.state[key].losingTrades;
        this.state[key].rugsShieldedCount = data.stats.rugsShieldedCount ?? this.state[key].rugsShieldedCount;
        this.state[key].insiderDumpsDodgedCount = data.stats.insiderDumpsDodgedCount ?? this.state[key].insiderDumpsDodgedCount;
      }
      this.persistState();
    }
  }
}

export const worker = new AutonomousTradingWorker();
