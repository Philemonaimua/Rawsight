import { TradePosition, TradeLog, VaultConfig, VaultState, TradingMode, LiveWalletState } from '../types';

const DB_NAME = 'rawsight_vault_db_v1';
const STORE_NAME = 'vault_records';
const DB_VERSION = 1;

interface PersistedEnvironmentData {
  cashBalance: number;
  positions: TradePosition[];
  logs: TradeLog[];
  config: VaultConfig;
  stats: {
    realizedPnlUsd: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    rugsShieldedCount: number;
    insiderDumpsDodgedCount: number;
    historicalCurve: { time: string; totalValue: number; pnl: number }[];
  };
  lastSaved: number;
}

// Open IndexedDB database safely
function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (e: any) => {
        resolve(e.target.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save environment data with dual-layer persistence:
 * 1. Primary: IndexedDB
 * 2. Fallback: LocalStorage
 * 3. Remote: Background Server Sync (/api/state)
 */
export async function saveVaultState(
  mode: TradingMode,
  walletAddress: string,
  data: PersistedEnvironmentData
): Promise<void> {
  const key = `vault_state_${mode}_${walletAddress || 'default'}`;

  // 1. IndexedDB
  try {
    const db = await openIndexedDb();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
    }
  } catch (err) {
    console.warn('IndexedDB save note:', err);
  }

  // 2. LocalStorage Fallback
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save note:', err);
  }

  // 3. Sync with Backend Server (non-blocking)
  try {
    if (typeof fetch !== 'undefined') {
      fetch('/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          walletAddress,
          data,
        }),
      }).catch(() => {
        // server might be in local mode or offline
      });
    }
  } catch {
    // ignore network sync errors
  }
}

/**
 * Load environment data with fallback cascade:
 * IndexedDB -> LocalStorage -> Default
 */
export async function loadVaultState(
  mode: TradingMode,
  walletAddress: string
): Promise<PersistedEnvironmentData | null> {
  const key = `vault_state_${mode}_${walletAddress || 'default'}`;

  // 1. Attempt IndexedDB
  try {
    const db = await openIndexedDb();
    if (db) {
      const data = await new Promise<PersistedEnvironmentData | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (data && data.positions) {
        return data;
      }
    }
  } catch (err) {
    console.warn('IndexedDB read note:', err);
  }

  // 2. LocalStorage fallback
  try {
    const local = localStorage.getItem(key);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed.cashBalance === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('LocalStorage read note:', err);
  }

  return null;
}

/**
 * Single Exclusive Wallet Persistence
 * Locks down wallet binding so the terminal always reconnects to the exclusive owner keypair.
 */
const EXCLUSIVE_WALLET_KEY = 'rawsight_exclusive_vault_wallet_v1';

export function getExclusiveBoundWallet(): { solanaAddress: string; evmAddress: string } | null {
  try {
    const raw = localStorage.getItem(EXCLUSIVE_WALLET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.solanaAddress && parsed.evmAddress) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export function saveExclusiveBoundWallet(solanaAddress: string, evmAddress: string): void {
  try {
    localStorage.setItem(
      EXCLUSIVE_WALLET_KEY,
      JSON.stringify({
        solanaAddress,
        evmAddress,
        boundAt: Date.now(),
      })
    );
  } catch {
    // fallback
  }
}
