import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await req.json();

    const updated = await ProductModel.findOneAndUpdate(
      { id: resolvedParams.id },
      body,
      { new: true }
    );

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
