import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.'
  });

  // Clear session cookie
  response.cookies.set('falak_admin_session', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0
  });

  return response;
}
