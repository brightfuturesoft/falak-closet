import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

// GET /api/auth/me — current session user, or `{ user: null }` when signed out.
// A signed-out visitor is a normal state, not an error: returning 200 keeps the
// browser console clean (401s show up as console errors and hurt Lighthouse's
// "Errors were logged to the console" audit).
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, user: null });
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
