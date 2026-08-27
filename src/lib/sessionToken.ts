/**
 * sessionToken.ts — pure HMAC-signed cookie tokens (no Next.js imports).
 *
 * Kept free of `next/*` and Prisma imports so `src/proxy.ts` (which must not
 * rely on shared modules or globals) can verify tokens at the edge without
 * dragging the app runtime along. Server helpers that need cookies/DB live in
 * `src/lib/session.ts`.
 *
 * Token format: `<base64url(payload)>.<base64url(hmac-sha256)>`
 */

import crypto from 'crypto';

/** httpOnly cookie carrying the signed customer session token. */
export const USER_SESSION_COOKIE = 'falak_session';
/** httpOnly cookie carrying the signed admin session token. */
export const ADMIN_SESSION_COOKIE = 'falak_admin_session';

/** Customer sessions last 30 days; admin sessions 24 hours. */
export const USER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24;

interface TokenPayload {
  /** Subject — user id (customer token) or admin username (admin token). */
  sub: string;
  /** Expiry, epoch milliseconds. */
  exp: number;
  /** Token role, so a customer token can never pass an admin check. */
  role: 'user' | 'admin';
}

/**
 * Falls back to a shared dev secret so local dev works without env setup.
 * The fallback is intentionally useless in production: set AUTH_SECRET.
 */
function getSecret(): string {
  return process.env.AUTH_SECRET || 'falak-dev-insecure-secret-change-me';
}

function sign(body: string): string {
  return crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
}

/** Constant-time string compare (length check first — timingSafeEqual throws on mismatch). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function mintToken(sub: string, role: 'user' | 'admin', ttlMs: number): string {
  const payload: TokenPayload = { sub, role, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function verifyToken(token: string | null | undefined, expectedRole: 'user' | 'admin'): TokenPayload | null {
  if (!token) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expectedSig: string;
  try {
    expectedSig = sign(body);
  } catch {
    return null;
  }
  if (!safeEqual(sig, expectedSig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (
      typeof payload.sub !== 'string' ||
      payload.role !== expectedRole ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ─── Customer session tokens ─────────────────────────────────────────────────

export function signUserSessionToken(userId: string): string {
  return mintToken(userId, 'user', USER_SESSION_TTL_MS);
}

export function verifyUserSessionToken(token: string | null | undefined): TokenPayload | null {
  return verifyToken(token, 'user');
}

// ─── Admin session tokens ────────────────────────────────────────────────────

export function signAdminSessionToken(username: string): string {
  return mintToken(username, 'admin', ADMIN_SESSION_TTL_MS);
}

export function verifyAdminSessionToken(token: string | null | undefined): TokenPayload | null {
  return verifyToken(token, 'admin');
}
