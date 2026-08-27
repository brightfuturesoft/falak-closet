import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

// GET /api/user/me/wishlist — retrieve the signed-in user's wishlist IDs
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    return NextResponse.json({ success: true, wishlist: user.wishlist ?? [] });
  } catch (error) {
    console.error('[GET /api/user/me/wishlist]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/user/me/wishlist — toggle a product ID in the user's wishlist
// Body: { productId: string }
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { productId } = body;
    if (typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    const targetId = productId.trim();
    const currentWishlist = user.wishlist ?? [];
    const exists = currentWishlist.includes(targetId);

    const updatedWishlist = exists
      ? currentWishlist.filter((id) => id !== targetId)
      : [...currentWishlist, targetId];

    await prisma.user.update({
      where: { id: user.id },
      data: { wishlist: updatedWishlist },
    });

    return NextResponse.json({ success: true, wishlist: updatedWishlist });
  } catch (error) {
    console.error('[POST /api/user/me/wishlist]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/user/me/wishlist — overwrite/merge the entire wishlist
// Body: { wishlist: string[] }
export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { wishlist } = body;
    if (!Array.isArray(wishlist)) {
      return NextResponse.json({ success: false, error: 'Wishlist must be an array of product IDs' }, { status: 400 });
    }

    const cleanWishlist = wishlist
      .filter((id: unknown): id is string => typeof id === 'string' && !!id.trim())
      .map((id) => id.trim());

    await prisma.user.update({
      where: { id: user.id },
      data: { wishlist: cleanWishlist },
    });

    return NextResponse.json({ success: true, wishlist: cleanWishlist });
  } catch (error) {
    console.error('[PUT /api/user/me/wishlist]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
