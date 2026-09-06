import { NextResponse } from 'next/server';
import {
  isAdminAuthenticated,
  ADMIN_SESSION_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  signAdminSessionToken,
} from '@/lib/session';

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    const response = NextResponse.json({ authenticated });

    if (authenticated) {
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        signAdminSessionToken(adminUser),
        ADMIN_COOKIE_OPTIONS
      );
    }

    return response;
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
