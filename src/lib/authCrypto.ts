/**
 * authCrypto.ts — password hashing with per-user random salts.
 *
 * New hashes are stored as `pbkdf2$<saltHex>$<hashHex>` (random 16-byte salt,
 * 100k iterations). Hashes written by the old code (shared hardcoded salt,
 * 10k iterations, no prefix) still verify so existing accounts can log in;
 * `needsRehash()` lets the login route upgrade them transparently.
 */

import crypto from 'crypto';

/** Kept only to verify hashes written before per-user salts existed. */
const LEGACY_SALT = 'falak_closet_secure_salt_2026';
const LEGACY_ITERATIONS = 10_000;
const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function derive(password: string, saltHex: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), iterations, KEY_LENGTH, DIGEST).toString('hex');
}

/** Hash a password with a fresh random salt → `pbkdf2$salt$hash`. */
export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  return `pbkdf2$${salt}$${derive(password, salt, ITERATIONS)}`;
}

/**
 * Verify a password against a stored hash. Accepts both the new
 * `pbkdf2$salt$hash` format and legacy shared-salt hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith('pbkdf2$')) {
    const [, salt, hash] = storedHash.split('$');
    if (!salt || !hash) return false;
    return timingSafeHexEqual(derive(password, salt, ITERATIONS), hash);
  }

  // Legacy format — same derivation the old hashPassword() used.
  return timingSafeHexEqual(derive(password, LEGACY_SALT, LEGACY_ITERATIONS), storedHash);
}

/** True when the stored hash predates per-user salts and should be upgraded on next login. */
export function needsRehash(storedHash: string): boolean {
  return !storedHash.startsWith('pbkdf2$');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
