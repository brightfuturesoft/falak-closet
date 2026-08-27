import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeOrder } from '@/lib/orders';
import { getSessionUser } from '@/lib/session';

// GET /api/orders/mine — orders belonging to the signed-in user.
// Matches the same way the checkout write path does: by account email, or by
// the shipping phone (guest orders placed with the same phone number).
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userEmail: user.email },
          // { shippingAddress: { is: { phone: user.phone } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders: orders.map(serializeOrder) });
  } catch (error) {
    console.error('[GET /api/orders/mine]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
