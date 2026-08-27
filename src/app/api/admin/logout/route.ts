import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  // Clear the signed admin session cookie.
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return response;
}
