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

    // Server-side validation of required fields
    const requiredChecks: [string, boolean][] = [
      ['name', !body.name?.trim()],
      ['category', !body.category?.trim()],
      ['price', !body.price || Number(body.price) <= 0],
      ['originalPrice', !body.originalPrice || Number(body.originalPrice) <= 0],
      ['workType', !body.workType?.trim()],
      ['occasion', !body.occasion?.trim()],
      ['material', !body.material?.trim()],
      ['description', !body.description?.trim()],
      ['colors', !Array.isArray(body.colors) || body.colors.length === 0],
      ['images', !Array.isArray(body.images) || body.images.length === 0],
    ];
    for (const [field, invalid] of requiredChecks) {
      if (invalid) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

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
