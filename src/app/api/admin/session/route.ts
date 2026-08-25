import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('falak_admin_session')?.value;
    const isAuthenticated = session === 'true';

    return NextResponse.json({
      authenticated: isAuthenticated
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
