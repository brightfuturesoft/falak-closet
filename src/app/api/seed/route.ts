import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { PromotionModel } from '@/models/Promotion';
import { OrderModel } from '@/models/Order';
import { CategoryModel } from '@/models/Category';
import { PRODUCTS } from '@/data/products';
import { PROMOTIONS } from '@/data/promotions';
import { INITIAL_CATEGORIES } from '@/data/categories';

export async function POST() {
  try {
    await connectToDatabase();

    // Clear and re-seed
    await ProductModel.deleteMany({});
    await PromotionModel.deleteMany({});
    await CategoryModel.deleteMany({});

    const mappedPromotions = PROMOTIONS.map((p) => ({
      code: p.code,
      discountType: 'percentage' as const,
      discountValue: p.discountPercentage,
      minSpend: p.minSpend || 0,
      usageLimit: 1000,
      usedCount: 0,
      expiryDate: new Date(p.expiryTimestamp).toISOString().split('T')[0],
      status: 'Active' as const
    }));

    await ProductModel.insertMany(PRODUCTS);
    await PromotionModel.insertMany(mappedPromotions);
    await CategoryModel.insertMany(INITIAL_CATEGORIES);

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
