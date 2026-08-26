import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildOrderData, serializeOrder, OrderValidationError } from '@/lib/orders';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

// ─── GET /api/orders ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, orders: orders.map(serializeOrder) });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// ─── POST /api/orders ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = buildOrderData(body);

    const order = await prisma.order.create({ data });

    // Auto-register the customer as a user profile. Deliberately in its own
    // try/catch: the order is already committed, so a profile-sync failure must
    // not turn a successful purchase into an error response.
    try {
      const { fullName, phone, district, city, fullAddress, street } = order.shippingAddress;
      const email =
        order.userEmail ||
        (fullName ? `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@falakcloset.com` : '') ||
        `${phone}@falakcloset.com`;

      const profile = {
        phone,
        name: fullName,
        district: district || city || 'Dhaka',
        fullAddress: fullAddress || street || 'Dhaka, Bangladesh',
        ...(order.userIp ? { ip: order.userIp } : {}),
      };

      await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        update: profile,
        create: { email: email.toLowerCase(), ...profile },
      });
    } catch (profileErr) {
      console.error('[POST /api/orders] profile sync skipped', profileErr);
    }

    return NextResponse.json(
      { success: true, message: 'Order placed', order: serializeOrder(order) },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PATCH /api/orders ───────────────────────────────────────────────────────
// body: { orderId: 'FLK-12345', status?: 'Out for Delivery', paymentStatus?: 'Verified' | 'Rejected' }
export async function PATCH(req: Request) {
  try {
    const { orderId, status, paymentStatus } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    // `orderId` is the customer-facing FLK number, which lives in `orderNumber`.
    const existing = await prisma.order.findUnique({ where: { orderNumber: String(orderId) } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = String(status);
    if (paymentStatus !== undefined) updateData.paymentStatus = String(paymentStatus);

    const order = await prisma.order.update({
      where: { orderNumber: existing.orderNumber },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated',
      order: serializeOrder(order),
    });
  } catch (err) {
    console.error('[PATCH /api/orders]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
