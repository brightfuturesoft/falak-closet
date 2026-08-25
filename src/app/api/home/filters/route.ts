import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CategoryModel } from '@/models/Category';
import { ProductModel } from '@/models/Product';
import { INITIAL_CATEGORIES } from '@/data/categories';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Fetch categories from DB
    let categories = await CategoryModel.find({}).lean();
    if (!categories || categories.length === 0) {
      await CategoryModel.insertMany(INITIAL_CATEGORIES);
      categories = await CategoryModel.find({}).lean();
    }

    // 2. Fetch live product counts for categories
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat: any) => {
        const categoryProductCount = await ProductModel.countDocuments({
          $or: [
            { category: { $regex: new RegExp(`^${escapeRegExp(cat.name)}$`, 'i') } },
            { category: { $regex: new RegExp(`^${escapeRegExp(cat.slug)}$`, 'i') } }
          ]
        });
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: categoryProductCount
        };
      })
    );

    // 3. Query unique product attributes from products in DB
    const occasionsRaw = await ProductModel.distinct('occasion');
    const materialsRaw = await ProductModel.distinct('material');
    const weathersRaw = await ProductModel.distinct('weather');

    // Filter out null/undefined/empty string values
    const occasions = occasionsRaw.filter((v: any) => typeof v === 'string' && v.trim() !== '');
    const materials = materialsRaw.filter((v: any) => typeof v === 'string' && v.trim() !== '');
    const weathers = weathersRaw.filter((v: any) => typeof v === 'string' && v.trim() !== '');

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts,
      occasions,
      materials,
      weathers
    });
  } catch (error: any) {
    console.error('Home filters API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
