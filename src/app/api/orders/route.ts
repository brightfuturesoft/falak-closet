import { NextResponse } from 'next/server';
import { getOrders, createOrder, updateOrderStatus } from '@/actions/orderActions';

export async function GET() {
  const data = await getOrders();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await createOrder(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { orderId, status } = await req.json();
    const data = await updateOrderStatus(orderId, status);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
