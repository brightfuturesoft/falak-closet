import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { PromotionModel } from '@/models/Promotion';
import { OrderModel } from '@/models/Order';
import { CategoryModel } from '@/models/Category';
import { HeroSlideModel } from '@/models/HeroSlide';
import { PRODUCTS } from '@/data/products';
import { PROMOTIONS } from '@/data/promotions';
import { INITIAL_CATEGORIES } from '@/data/categories';

const DEFAULT_HERO_SLIDES = [
  {
    tag: 'FRESH OFFERS',
    title: 'Style picks for every plan',
    subtitle: 'Discover clothing deals, curated collections, and easy checkout in one place.',
    ctaText: 'View Offers',
    ctaLink: '/live-promotions',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=85',
    order: 1,
    isActive: true
  },
  {
    tag: 'SEASONAL DEALS',
    title: 'New looks with better prices',
    subtitle: 'Explore timely offers across clothes, fabrics, accessories, and more.',
    ctaText: 'Shop Deals',
    ctaLink: '/shop',
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=1600&q=85',
    order: 2,
    isActive: true
  }
];

export async function POST() {
  try {
    await connectToDatabase();

    // Clear and re-seed
    await ProductModel.deleteMany({});
    await PromotionModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await HeroSlideModel.deleteMany({});

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
    await HeroSlideModel.insertMany(DEFAULT_HERO_SLIDES);

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
