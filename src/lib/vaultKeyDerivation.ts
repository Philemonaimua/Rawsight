import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';

export interface AutonomousVaultKeys {
  solanaAddress: string;
  solanaSecretKey: string; // Base58 encoded 64-byte secret key
  solanaSecretKeyArray: number[]; // Raw byte array format for Solscan / CLI tools
  evmAddress: string; // 0x... EVM address for BNB Smart Chain and Robinhood Chain
  evmPrivateKey: string; // 0x... 64-hex EVM private key
  masterPin: string;
  createdAt: number;
}

// Standard Bitcoin / Solana Base58 Alphabet
const BS58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * High-performance, zero-dependency Base58 encoder for Solana private keys
 */
export function encodeBase58(source: Uint8Array | number[]): string {
  if (!source || source.length === 0) return '';
  const bytes = Array.from(source);
  const digits = [0];
  
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += bytes[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  
  let str = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += BS58_ALPHABET[digits[i]];
  }
  return str;
}

/**
 * Base58 decoder for Solana private key import
 */
export function decodeBase58(str: string): Uint8Array {
  if (!str || str.length === 0) return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = BS58_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] *= 58;
    }
    bytes[0] += value;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

const STORAGE_VAULT_KEYS = 'rawsight_pin_derived_vault_keys_v6';
const STORAGE_SESSION_PIN = 'rawsight_session_pin_v1';

// In-memory cache of derived keys for zero-delay operations
let inMemoryCachedKeys: AutonomousVaultKeys | null = null;
let inMemorySolanaKeypair: Keypair | null = null;
let inMemoryEvmWallet: ethers.Wallet | null = null;

/**
 * Deterministically derive both Solana Mainnet and EVM (BNB + Robinhood) wallets from a Master PIN.
 * This guarantees:
 * 1. The exact same Master PIN always produces the exact same Solana public & private key.
 * 2. The exact same Master PIN always produces the exact same EVM (BNB + Robinhood) public & private key.
 * 3. Logging in with the Master PIN automatically decrypts and activates both wallets.
 */
export function deriveVaultKeysFromPin(pin: string): AutonomousVaultKeys {
  const normalizedPin = (pin || '1234').trim();

  // 1. Derive 32-byte Cryptographic Seed for Solana using PBKDF2
  const solanaSalt = ethers.toUtf8Bytes('rawsight_solana_mainnet_salt_production_v2');
  const solanaSeedHex = ethers.pbkdf2(
    ethers.toUtf8Bytes(normalizedPin),
    solanaSalt,
    10000,
    32,
    'sha256'
  );
  const solanaSeedBytes = ethers.getBytes(solanaSeedHex);
  const solanaKeypair = Keypair.fromSeed(solanaSeedBytes);
  const solanaAddress = solanaKeypair.publicKey.toBase58();
  const solanaSecretKeyArray = Array.from(solanaKeypair.secretKey);
  const solanaSecretKey = encodeBase58(solanaKeypair.secretKey);

  // 2. Derive 32-byte Cryptographic Seed for EVM (Shared between BNB Chain & Robinhood Chain)
  const evmSalt = ethers.toUtf8Bytes('rawsight_evm_mainnet_salt_production_v2');
  const evmSeedHex = ethers.pbkdf2(
    ethers.toUtf8Bytes(normalizedPin),
    evmSalt,
    10000,
    32,
    'sha256'
  );
  const evmWallet = new ethers.Wallet(evmSeedHex);
  const evmAddress = ethers.getAddress(evmWallet.address); // Checksummed 0x... EVM address
  const evmPrivateKey = evmWallet.privateKey; // 0x... 64-hex characters

  const vaultKeys: AutonomousVaultKeys = {
    solanaAddress,
    solanaSecretKey,
    solanaSecretKeyArray,
    evmAddress,
    evmPrivateKey,
    masterPin: normalizedPin,
    createdAt: Date.now(),
  };

  // Cache in-memory instances
  inMemoryCachedKeys = vaultKeys;
  inMemorySolanaKeypair = solanaKeypair;
  inMemoryEvmWallet = evmWallet;

  // Persist derived bundle and active session pin
  try {
    sessionStorage.setItem(STORAGE_SESSION_PIN, normalizedPin);
    localStorage.setItem(STORAGE_VAULT_KEYS, JSON.stringify(vaultKeys));
  } catch (e) {
    console.warn('Storage sync notice:', e);
  }

  return vaultKeys;
}

/**
 * Get active derived vault keys. If cached in memory or session storage, returns them.
 * Defaults to deriving from environment or default master PIN '1234'.
 */
export function getActiveVaultKeys(overridePin?: string): AutonomousVaultKeys {
  if (overridePin && overridePin.trim()) {
    return deriveVaultKeysFromPin(overridePin);
  }

  if (inMemoryCachedKeys) {
    return inMemoryCachedKeys;
  }

  // Attempt to recover active PIN from sessionStorage
  try {
    const sessionPin = sessionStorage.getItem(STORAGE_SESSION_PIN);
    if (sessionPin && sessionPin.trim()) {
      return deriveVaultKeysFromPin(sessionPin);
    }
  } catch {}

  // Attempt to recover from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_VAULT_KEYS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.solanaAddress && parsed.evmAddress) {
        inMemoryCachedKeys = parsed;
        if (parsed.solanaSecretKeyArray) {
          inMemorySolanaKeypair = Keypair.fromSecretKey(new Uint8Array(parsed.solanaSecretKeyArray));
        }
        if (parsed.evmPrivateKey) {
          inMemoryEvmWallet = new ethers.Wallet(parsed.evmPrivateKey);
        }
        return parsed;
      }
    }
  } catch {}

  // Default fallback to expected environment PIN or '1234'
  const fallbackPin = ((import.meta as any).env?.VITE_MASTER_PIN as string) || '1234';
  return deriveVaultKeysFromPin(fallbackPin);
}

/**
 * Get active Solana Keypair instance for real-time transaction signing
 */
export function getActiveSolanaKeypair(): Keypair {
  if (inMemorySolanaKeypair) {
    return inMemorySolanaKeypair;
  }
  const keys = getActiveVaultKeys();
  if (keys.solanaSecretKeyArray && keys.solanaSecretKeyArray.length > 0) {
    inMemorySolanaKeypair = Keypair.fromSecretKey(new Uint8Array(keys.solanaSecretKeyArray));
    return inMemorySolanaKeypair;
  }
  return Keypair.fromSeed(new Uint8Array(32));
}

/**
 * Get active EVM ethers.Wallet instance for BSC and Robinhood Chain transaction signing
 */
export function getActiveEvmWallet(provider?: ethers.Provider): ethers.Wallet {
  if (inMemoryEvmWallet) {
    return provider ? inMemoryEvmWallet.connect(provider) : inMemoryEvmWallet;
  }
  const keys = getActiveVaultKeys();
  inMemoryEvmWallet = new ethers.Wallet(keys.evmPrivateKey);
  return provider ? inMemoryEvmWallet.connect(provider) : inMemoryEvmWallet;
}
