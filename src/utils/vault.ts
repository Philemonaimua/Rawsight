import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';

// Unique keys for deterministic local encryption / key storage
const STORAGE_PREFIX = 'rawsight_vault_keys_v2';
const MIGRATION_KEY = 'rawsight_vault_state_v1';

export interface InternalTradingVault {
  id: string;
  solanaPublicKey: string;
  solanaPrivateKey: string; // Base58 or JSON array string
  evmAddress: string;
  evmPrivateKey: string;    // Hex private key
  createdAt: number;
  label: string;
}

/**
 * Deterministic XOR/Base64 lightweight vault obfuscation for browser localStorage
 */
function obfuscateString(data: string, salt: string = 'rawsight_quant_sec_2026'): string {
  try {
    const textBytes = new TextEncoder().encode(data);
    const saltBytes = new TextEncoder().encode(salt);
    const result = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      result[i] = textBytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return btoa(String.fromCharCode(...result));
  } catch {
    return btoa(data);
  }
}

function deobfuscateString(encoded: string, salt: string = 'rawsight_quant_sec_2026'): string {
  try {
    const raw = atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    const saltBytes = new TextEncoder().encode(salt);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    try {
      return atob(encoded);
    } catch {
      return '';
    }
  }
}

/**
 * Retrieve or generate a fixed, permanent operational vault wallet.
 * If one already exists in localStorage, it will NEVER generate a new one.
 */
export function getOrCreateTradingVault(): InternalTradingVault {
  if (typeof window === 'undefined') {
    return {
      id: 'server-mock',
      solanaPublicKey: '11111111111111111111111111111111',
      solanaPrivateKey: '[]',
      evmAddress: '0x0000000000000000000000000000000000000000',
      evmPrivateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      createdAt: Date.now(),
      label: 'Main Operational Trading Vault',
    };
  }

  try {
    const rawStored = localStorage.getItem(STORAGE_PREFIX);
    if (rawStored) {
      const decrypted = deobfuscateString(rawStored);
      if (decrypted) {
        const parsed = JSON.parse(decrypted) as InternalTradingVault;
        if (parsed.solanaPublicKey && parsed.evmAddress && parsed.solanaPrivateKey) {
          return parsed;
        }
      }
    }

    // Check fallback migration keys
    const fallbackRaw = localStorage.getItem('RAW_AUTONOMOUS_KEYPAIR_V3');
    if (fallbackRaw) {
      try {
        const parsedOld = JSON.parse(fallbackRaw);
        if (parsedOld.solanaAddress && parsedOld.evmAddress) {
          const migrated: InternalTradingVault = {
            id: 'vault_migrated_' + Date.now(),
            solanaPublicKey: parsedOld.solanaAddress,
            solanaPrivateKey: parsedOld.solanaSecretKeyBase58 || JSON.stringify(parsedOld.solanaSecretKey || []),
            evmAddress: parsedOld.evmAddress,
            evmPrivateKey: parsedOld.evmPrivateKey || '',
            createdAt: Date.now(),
            label: 'Operational Trading Vault',
          };
          saveTradingVault(migrated);
          return migrated;
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Vault storage read warning:', e);
  }

  // Generate deterministic/fresh permanent keypair once
  const solKeypair = Keypair.generate();
  const solanaPublicKey = solKeypair.publicKey.toBase58();
  const solanaPrivateKey = JSON.stringify(Array.from(solKeypair.secretKey));

  const evmWallet = ethers.Wallet.createRandom();
  const evmAddress = evmWallet.address;
  const evmPrivateKey = evmWallet.privateKey;

  const newVault: InternalTradingVault = {
    id: 'vault_' + Math.random().toString(36).substring(2, 9),
    solanaPublicKey,
    solanaPrivateKey,
    evmAddress,
    evmPrivateKey,
    createdAt: Date.now(),
    label: 'Main Operational Trading Vault',
  };

  saveTradingVault(newVault);
  return newVault;
}

/**
 * Securely write trading vault to localStorage
 */
export function saveTradingVault(vault: InternalTradingVault): void {
  try {
    const serialized = JSON.stringify(vault);
    const obfuscated = obfuscateString(serialized);
    localStorage.setItem(STORAGE_PREFIX, obfuscated);
    
    // Also store unencrypted public addresses for instant UI retrieval
    localStorage.setItem('rawsight_active_sol_pubkey', vault.solanaPublicKey);
    localStorage.setItem('rawsight_active_evm_addr', vault.evmAddress);
  } catch (e) {
    console.error('Failed to save trading vault to storage:', e);
  }
}

/**
 * Clear the stored vault (for user-requested wallet reset)
 */
export function resetTradingVault(): InternalTradingVault {
  try {
    localStorage.removeItem(STORAGE_PREFIX);
    localStorage.removeItem('rawsight_active_sol_pubkey');
    localStorage.removeItem('rawsight_active_evm_addr');
    localStorage.removeItem(MIGRATION_KEY);
  } catch {}
  return getOrCreateTradingVault();
}

/**
 * Export Solana Keypair instance from the persisted vault
 */
export function getSolanaKeypairFromVault(vault: InternalTradingVault): Keypair | null {
  try {
    if (vault.solanaPrivateKey.startsWith('[')) {
      const arr = JSON.parse(vault.solanaPrivateKey);
      return Keypair.fromSecretKey(new Uint8Array(arr));
    }
    return null;
  } catch {
    return null;
  }
}
