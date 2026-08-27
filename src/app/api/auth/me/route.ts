import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

// GET /api/auth/me — current session user, or 401 when signed out.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not signed in' },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true, user, wishlist: user.wishlist ?? [], cart: user.cart ?? [] });
  } catch (error) {
    console.error('[me]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
