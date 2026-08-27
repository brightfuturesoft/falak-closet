import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  signAdminSessionToken,
} from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Credentials come from env only — no hardcoded fallback. Without env vars
    // set there is simply no way to log in, by design.
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      console.error('[admin/login] ADMIN_USERNAME / ADMIN_PASSWORD are not configured');
      return NextResponse.json(
        { success: false, error: 'Admin login is not configured on this server' },
        { status: 503 }
      );
    }

    if (username?.trim() === adminUser && password === adminPass) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully.',
      });

      // Signed, httpOnly token — cannot be forged by setting a cookie by hand.
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        signAdminSessionToken(adminUser),
        ADMIN_COOKIE_OPTIONS
      );
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
