import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

const MAX_WISHLIST_IDS = 1000;

// GET /api/user/me — profile + wishlist product ids for the signed-in user.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user, wishlist: user.wishlist ?? [] });
  } catch (error) {
    console.error('[GET /api/user/me]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/user/me — update the signed-in user's own profile/address/wishlist.
// Body (all optional): { name?, phone?, district?, fullAddress?, wishlist? }
export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const data: {
      name?: string;
      phone?: string;
      district?: string;
      fullAddress?: string;
      wishlist?: string[];
    } = {};

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 120);
    if (typeof body.phone === 'string' && body.phone.trim()) data.phone = body.phone.trim().slice(0, 30);
    if (typeof body.district === 'string' && body.district.trim()) data.district = body.district.trim().slice(0, 80);
    if (typeof body.fullAddress === 'string') data.fullAddress = body.fullAddress.trim().slice(0, 500);

    // Wishlist is synced as product ids by the cart context (fire-and-forget).
    if (Array.isArray(body.wishlist)) {
      const ids = body.wishlist
        .filter((id: unknown): id is string => typeof id === 'string')
        .slice(0, MAX_WISHLIST_IDS);
      data.wishlist = ids;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        district: true,
        fullAddress: true,
        wishlist: true,
      },
    });

    return NextResponse.json({ success: true, user, wishlist: user.wishlist ?? [] });
  } catch (error) {
    console.error('[PATCH /api/user/me]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
