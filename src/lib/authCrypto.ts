import crypto from 'crypto';

const SALT = 'falak_closet_secure_salt_2026';

export function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.pbkdf2Sync(password, SALT, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const hash = hashPassword(password);
  return hash === storedHash;
}
