/**
 * proxy.ts — Next.js 16 route protection (middleware was renamed to proxy).
 *
 * Verified rules:
 *  • `/admin/<anything-but-the-login-page>` → needs a signed admin cookie,
 *    otherwise redirected to `/admin` (the login gate).
 *  • `/api/admin/**` (except login/logout/session, which are the auth surface
 *    itself) → 401 without a signed admin cookie.
 *  • `/api/user/me*` and `/api/orders/mine` → 401 without a customer session.
 *  • `/api/user/all` → admin only. The legacy open `/api/user` lookup is gone;
 *    any call to it gets a 404. The aggregated `/api/customers` directory
 *    (phones, IPs, addresses, spend) is admin-only for every method.
 *  • Mutations (non-GET/HEAD/OPTIONS) on the catalog/settings/security routes
 *    (`/api/products`, `/api/categories`, `/api/promotions` — except the public
 *    `/api/promotions/validate` — `/api/hero-slides`, `/api/delivery-zones`,
 *    `/api/settings`, `/api/security`, `/api/upload`, `/api/seed`,
 *    `/api/revalidate`) and on `/api/orders` (PATCH/PUT/DELETE) → admin only.
 *
 * Deliberately public: `/` and all storefront pages, `/account` (the page
 * itself renders the auth screen when there is no session), `/checkout`
 * (guest checkout with just phone/email is a core flow), `GET` on public
 * catalog APIs, `POST /api/orders` (guest checkout), `POST /api/reviews`,
 * and `/api/user/reset-password` (identifier + OTP based by design).
 *
 * Tokens are only signature+expiry checked here; every protected route
 * handler still validates its own session (defense in depth).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  USER_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyUserSessionToken,
  verifyAdminSessionToken,
} from '@/lib/sessionToken';

function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

function hasUserSession(req: NextRequest): boolean {
  return verifyUserSessionToken(req.cookies.get(USER_SESSION_COOKIE)?.value) !== null;
}

function hasAdminSession(req: NextRequest): boolean {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value) !== null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // ── Admin pages ────────────────────────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // `/admin` itself renders the login gate; sub-tabs require a session.
    if (pathname !== '/admin' && pathname !== '/admin/' && !hasAdminSession(req)) {
      return NextResponse.redirect(new URL('/admin?reason=session-required', req.url));
    }
    return NextResponse.next();
  }

  // ── API routes ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Prevent direct browser window navigation to API endpoints by redirecting to homepage
    const acceptHeader = req.headers.get('accept') || '';
    const fetchDest = req.headers.get('sec-fetch-dest') || '';
    const fetchMode = req.headers.get('sec-fetch-mode') || '';

    const isDirectBrowserNavigation =
      fetchDest === 'document' ||
      fetchMode === 'navigate' ||
      (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json'));

    if (isDirectBrowserNavigation) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Admin API surface — the auth endpoints themselves stay reachable.
    if (pathname.startsWith('/api/admin')) {
      const isAuthSurface =
        pathname === '/api/admin/login' || pathname === '/api/admin/logout' || pathname === '/api/admin/session';
      if (!isAuthSurface && !hasAdminSession(req)) {
        return unauthorized('Admin session required');
      }
      return NextResponse.next();
    }

    // Customer session-scoped endpoints.
    if (pathname === '/api/user/me' || pathname.startsWith('/api/user/me/') || pathname === '/api/orders/mine') {
      if (!hasUserSession(req)) return unauthorized('Please sign in to continue');
      return NextResponse.next();
    }

    if (pathname.startsWith('/api/user')) {
      // Admin-only customer directory.
      if (pathname === '/api/user/all' && !hasAdminSession(req)) {
        return unauthorized('Admin session required');
      }
      // The old unauthenticated /api/user lookup/upsert was removed for
      // security (it leaked and let anyone overwrite any profile by email).
      if (pathname === '/api/user') {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      // /api/user/reset-password stays public — it is identifier + OTP based.
      return NextResponse.next();
    }

    // Admin-only aggregated customer directory — exposes PII (phones, IPs,
    // addresses, lifetime spend) on GET, so guard reads too, not just mutations.
    if (pathname === '/api/customers' && !hasAdminSession(req)) {
      return unauthorized('Admin session required');
    }

    if (isMutation) {
      const isOrderMutation = pathname === '/api/orders'; // PATCH order status etc.
      const isPromotionValidate = pathname === '/api/promotions/validate';
      const isAdminOnlyApi =
        pathname === '/api/upload' ||
        pathname === '/api/seed' ||
        pathname === '/api/revalidate' ||
        pathname === '/api/settings' ||
        pathname.startsWith('/api/security') ||
        pathname.startsWith('/api/products') ||
        pathname.startsWith('/api/categories') ||
        pathname.startsWith('/api/hero-slides') ||
        pathname.startsWith('/api/delivery-zones') ||
        (pathname.startsWith('/api/promotions') && !isPromotionValidate) ||
        (isOrderMutation && method !== 'POST'); // POST /api/orders = guest checkout

      if (isAdminOnlyApi && !hasAdminSession(req)) {
        return unauthorized('Admin session required');
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
