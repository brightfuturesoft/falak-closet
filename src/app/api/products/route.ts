import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { PRODUCTS } from '@/data/products';

export async function GET() {
  try {
    await connectToDatabase();
    const products = await ProductModel.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, products: products || [], source: 'mongodb' });
  } catch (error) {
    return NextResponse.json({ success: true, products: [], source: 'error' });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const id = body.id || `flk-${Math.floor(1000 + Math.random() * 9000)}`;
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = await ProductModel.create({
      ...body,
      id,
      slug
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
