import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { PromotionModel } from '@/models/Promotion';
import { OrderModel } from '@/models/Order';
import { PRODUCTS } from '@/data/products';
import { PROMOTIONS } from '@/data/promotions';

export async function POST() {
  try {
    await connectToDatabase();

    // Clear and re-seed
    await ProductModel.deleteMany({});
    await PromotionModel.deleteMany({});

    await ProductModel.insertMany(PRODUCTS);
    await PromotionModel.insertMany(PROMOTIONS);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with 2026 modest fashion dataset!'
    });
  } catch (error) {
    console.error('Seed API Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
