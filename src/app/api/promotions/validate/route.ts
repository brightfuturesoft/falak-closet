import { NextResponse } from 'next/server';
import { validatePromotion } from '@/actions/orderActions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await validatePromotion(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
