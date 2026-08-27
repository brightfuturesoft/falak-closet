import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

const MAX_CART_ITEMS = 100;

// GET /api/user/me/cart — retrieve the signed-in user's saved cart
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }
    return NextResponse.json({ success: true, cart: user.cart ?? [] });
  } catch (error) {
    console.error('[GET /api/user/me/cart]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/user/me/cart — overwrite the entire cart for the signed-in user
// Body: { cart: { productId, selectedColor, selectedSize, quantity }[] }
export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { cart } = body;

    if (!Array.isArray(cart)) {
      return NextResponse.json(
        { success: false, error: 'Cart must be an array of cart items' },
        { status: 400 }
      );
    }

    // Sanitise: only keep valid items, cap at MAX_CART_ITEMS
    const cleanCart = cart
      .filter(
        (item: unknown): item is { productId: string; selectedColor: string; selectedSize: string; quantity: number } =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).productId === 'string' &&
          !!(item as Record<string, unknown>).productId &&
          typeof (item as Record<string, unknown>).selectedColor === 'string' &&
          typeof (item as Record<string, unknown>).selectedSize === 'string' &&
          typeof (item as Record<string, unknown>).quantity === 'number' &&
          ((item as Record<string, unknown>).quantity as number) > 0
      )
      .slice(0, MAX_CART_ITEMS)
      .map((item) => ({
        productId: String(item.productId).trim(),
        selectedColor: String(item.selectedColor).trim(),
        selectedSize: String(item.selectedSize).trim(),
        quantity: Math.min(Math.floor(item.quantity), 999),
      }));

    await prisma.user.update({
      where: { id: user.id },
      data: { cart: cleanCart },
    });

    return NextResponse.json({ success: true, cart: cleanCart });
  } catch (error) {
    console.error('[PUT /api/user/me/cart]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
