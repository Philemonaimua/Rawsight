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
 * NEVER resets or randomizes wallet on reload.
 */
const EXCLUSIVE_WALLET_KEY = 'rawsight_exclusive_vault_wallet_v2';
const ACTIVE_SOLANA_KEY = 'rawsight_active_solana_wallet_address_v2';

/**
 * Get target wallet public key from environment variables (Vite / Next / standard process.env)
 */
export function getTargetWalletFromEnv(): string {
  try {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
    if (metaEnv) {
      if (metaEnv.VITE_TARGET_WALLET) return String(metaEnv.VITE_TARGET_WALLET).trim();
      if (metaEnv.NEXT_PUBLIC_TARGET_WALLET) return String(metaEnv.NEXT_PUBLIC_TARGET_WALLET).trim();
    }
  } catch {}

  try {
    const procEnv = typeof process !== 'undefined' ? process.env : undefined;
    if (procEnv) {
      if (procEnv.NEXT_PUBLIC_TARGET_WALLET) return String(procEnv.NEXT_PUBLIC_TARGET_WALLET).trim();
      if (procEnv.VITE_TARGET_WALLET) return String(procEnv.VITE_TARGET_WALLET).trim();
    }
  } catch {}

  return '';
}

/**
 * Retrieve the active persisted Solana wallet address.
 * Precedence:
 * 1. Environment Variable (VITE_TARGET_WALLET / NEXT_PUBLIC_TARGET_WALLET)
 * 2. LocalStorage persisted active Solana address
 * 3. LocalStorage exclusive vault wallet
 */
export function getPersistedActiveSolanaWallet(): string {
  const envTarget = getTargetWalletFromEnv();
  if (envTarget) return envTarget;

  try {
    const directStored = localStorage.getItem(ACTIVE_SOLANA_KEY);
    if (directStored && directStored.trim()) {
      return directStored.trim();
    }
  } catch (e) {
    console.warn('Wallet persistence read warning:', e);
  }

  return '';
}

/**
 * Store the active Solana public key when user connects.
 */
export function setPersistedActiveSolanaWallet(address: string): void {
  if (!address || !address.trim()) {
    try {
      localStorage.removeItem(ACTIVE_SOLANA_KEY);
      localStorage.removeItem(EXCLUSIVE_WALLET_KEY);
    } catch {}
    return;
  }
  const cleanAddr = address.trim();

  try {
    localStorage.setItem(ACTIVE_SOLANA_KEY, cleanAddr);
    localStorage.setItem(
      EXCLUSIVE_WALLET_KEY,
      JSON.stringify({
        solanaAddress: cleanAddr,
        boundAt: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Wallet persistence save warning:', e);
  }
}

export function clearPersistedActiveSolanaWallet(): void {
  try {
    localStorage.removeItem(ACTIVE_SOLANA_KEY);
    localStorage.removeItem(EXCLUSIVE_WALLET_KEY);
  } catch {}
}

export function getExclusiveBoundWallet(): { solanaAddress: string; evmAddress?: string } | null {
  const sol = getPersistedActiveSolanaWallet();
  if (sol) {
    return { solanaAddress: sol };
  }
  return null;
}

export function saveExclusiveBoundWallet(solanaAddress: string, evmAddress?: string): void {
  setPersistedActiveSolanaWallet(solanaAddress);
}
