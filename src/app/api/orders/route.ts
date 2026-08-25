import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { OrderModel } from '@/models/Order';
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const orders = await OrderModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: true, orders: [], source: 'offline' });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const newOrder = await OrderModel.create(body);

    // Auto-register user profile in User Collection upon purchase
    try {
      const email = body.userEmail || (body.shippingAddress?.fullName ? `${body.shippingAddress.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@falakcloset.com` : undefined);
      const phone = body.shippingAddress?.phone;
      const name = body.shippingAddress?.fullName;

      if (phone && name) {
        await UserModel.findOneAndUpdate(
          { phone },
          {
            email: email || `${phone}@falakcloset.com`,
            phone,
            name,
            district: body.shippingAddress?.district || body.shippingAddress?.city || 'Dhaka',
            fullAddress: body.shippingAddress?.fullAddress || body.shippingAddress?.street || 'Dhaka, Bangladesh',
            ip: body.userIp || '103.24.12.89'
          },
          { upsert: true, new: true }
        );
      }
    } catch { }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { orderId, status } = await req.json();

    const updated = await OrderModel.findOneAndUpdate(
      { id: orderId },
      { status },
      { new: true }
    );

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
