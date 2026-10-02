import crypto from 'crypto';
import { config } from '../config/env';

/**
 * ============================================================================
 * LACS Module #19: OAuth Token Encryption Utility
 * ============================================================================
 *
 * Implements authenticated symmetric encryption (AES-256-GCM) for storing
 * sensitive OAuth credentials (access tokens, refresh tokens) securely at rest.
 *
 * Security Guarantees:
 * 1. Confidentiality: AES-256 encryption prevents reading raw tokens from database dumps.
 * 2. Authenticity & Integrity: 128-bit GCM authentication tags prevent tampering/bit-flipping.
 * 3. Unique Nonce: Fresh, cryptographically secure 96-bit (12-byte) IV for every encryption call.
 * 4. Zero Client Exposure: Plaintext tokens exist only ephemerally in server memory during
 *    active Google Search Console API requests. Plaintext tokens must NEVER be returned in
 *    API response payloads or exposed to frontend components.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits standard authentication tag

/**
 * Derives a strictly typed 32-byte (256-bit) Buffer key from the configured secret.
 */
function getDerivedKey(overrideKey?: string): Buffer {
  const secret = (overrideKey || config.gsc?.tokenEncryptionKey || '').trim();
  if (!secret) {
    throw new Error(
      'GSC OAuth token encryption requires GSC_TOKEN_ENCRYPTION_KEY to be configured in environment variables.'
    );
  }
  // SHA-256 guarantees an exact 32-byte binary key regardless of input string length
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a sensitive OAuth token string using AES-256-GCM.
 *
 * @param plaintext The raw token string (e.g. Google access_token or refresh_token).
 * @param overrideKey Optional key override (for testing or key rotation).
 * @returns Serialized encrypted payload in the format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */
export function encryptOAuthToken(plaintext: string, overrideKey?: string): string {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('Cannot encrypt empty or non-string token.');
  }

  const key = getDerivedKey(overrideKey);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted OAuth token back into its raw string.
 *
 * @param encryptedPayload Serialized payload in `${ivHex}:${authTagHex}:${ciphertextHex}` format.
 * @param overrideKey Optional key override (for testing or key rotation).
 * @returns The original plaintext token string.
 * @throws Error if payload is invalid, tampered with, corrupted, or key does not match.
 */
export function decryptOAuthToken(encryptedPayload: string, overrideKey?: string): string {
  if (typeof encryptedPayload !== 'string' || encryptedPayload.trim().length === 0) {
    throw new Error('Cannot decrypt empty or non-string payload.');
  }

  const parts = encryptedPayload.trim().split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format. Expected 3 colon-separated hex segments.');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  if (ivHex.length !== IV_LENGTH_BYTES * 2) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH_BYTES * 2} hex characters.`);
  }

  if (authTagHex.length !== AUTH_TAG_LENGTH_BYTES * 2) {
    throw new Error(`Invalid authentication tag length. Expected ${AUTH_TAG_LENGTH_BYTES * 2} hex characters.`);
  }

  if (!ciphertextHex || ciphertextHex.length === 0) {
    throw new Error('Ciphertext payload segment is empty.');
  }

  try {
    const key = getDerivedKey(overrideKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err: any) {
    // Note: Do not leak error details or cipher buffers in exception messages
    throw new Error(
      'OAuth token decryption failed: invalid encryption key, corrupted payload, or authentication tag mismatch.'
    );
  }
}

/**
 * Checks whether a given string adheres to the serialized AES-256-GCM format.
 *
 * @param value String to test
 * @returns boolean true if value matches the `${ivHex}:${authTagHex}:${ciphertextHex}` format
 */
export function isEncryptedOAuthToken(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.trim().split(':');
  if (parts.length !== 3) return false;

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const hexRegex = /^[0-9a-fA-F]+$/;

  return (
    ivHex.length === IV_LENGTH_BYTES * 2 &&
    hexRegex.test(ivHex) &&
    authTagHex.length === AUTH_TAG_LENGTH_BYTES * 2 &&
    hexRegex.test(authTagHex) &&
    ciphertextHex.length > 0 &&
    hexRegex.test(ciphertextHex)
  );
}
