import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const product = await ProductModel.findOne({ id: resolvedParams.id });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await req.json();

    // Validate fields only if they are present in the body and invalid
    if ('name' in body && !body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }
    if ('price' in body && Number(body.price) <= 0) {
      return NextResponse.json({ success: false, error: 'price must be greater than 0' }, { status: 400 });
    }
    if ('originalPrice' in body && Number(body.originalPrice) <= 0) {
      return NextResponse.json({ success: false, error: 'originalPrice must be greater than 0' }, { status: 400 });
    }

    const updated = await ProductModel.findOneAndUpdate(
      { id: resolvedParams.id },
      body,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;

    await ProductModel.deleteOne({ id: resolvedParams.id });
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
