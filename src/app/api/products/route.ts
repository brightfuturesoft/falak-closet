import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/actions/productActions';

export async function GET() {
  const data = await getProducts();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await createProduct(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
