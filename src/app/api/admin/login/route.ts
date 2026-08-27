import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'falak123';

    if (username?.trim() === adminUser && password === adminPass) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully.'
      });

      // Set session cookie valid for 24 hours
      response.cookies.set('falak_admin_session', 'true', {
        httpOnly: false, // Accessible by client JS as fallback
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });

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
