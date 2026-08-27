/**
 * session.ts — server-side session helpers built on the signed-cookie tokens
 * from `sessionToken.ts`. Safe for Route Handlers, Server Components and
 * Server Actions (uses `next/headers`); NOT for `src/proxy.ts`.
 */

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_SESSION_COOKIE,
  USER_SESSION_COOKIE,
  USER_SESSION_TTL_MS,
  ADMIN_SESSION_TTL_MS,
  verifyUserSessionToken,
  verifyAdminSessionToken,
  signUserSessionToken,
  signAdminSessionToken,
} from '@/lib/sessionToken';

/** Fields that are safe to hand to the browser — never passwordHash/resetOtp. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  fullAddress: string;
  wishlist: string[];
  cart?: { productId: string; selectedColor: string; selectedSize: string; quantity: number }[];
}

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  district: true,
  fullAddress: true,
  wishlist: true,
  cart: true,
  isBlocked: true,
} as const;

/** Options for the httpOnly session cookies set by /api/auth/* and /api/admin/login. */
export const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: Math.floor(USER_SESSION_TTL_MS / 1000),
};

export const ADMIN_COOKIE_OPTIONS = {
  ...USER_COOKIE_OPTIONS,
  maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
};

/**
 * Reads the signed customer session cookie, validates it, and loads the
 * (non-blocked) user from the DB. Returns null when unauthenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const payload = verifyUserSessionToken(store.get(USER_SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: SAFE_USER_SELECT,
  });

  if (!user || user.isBlocked) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    district: user.district,
    fullAddress: user.fullAddress,
    wishlist: user.wishlist,
    cart: user.cart,
  };
}

/** True only when a valid, unexpired signed admin cookie is present. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value) !== null;
}

export { signUserSessionToken, signAdminSessionToken, USER_SESSION_COOKIE, ADMIN_SESSION_COOKIE };
