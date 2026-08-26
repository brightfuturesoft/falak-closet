import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';
import { buildProductData, resolveUniqueSlug } from '@/lib/products';
import { PRODUCTS } from '@/data/products';

// POST /api/products/seed — seeds the catalog with PRODUCTS if it is empty.
// Mirrors /api/categories/seed: idempotent, never destructive.
export async function POST() {
  try {
    // only admin can run this 
    const existing = await prisma.product.count();
    if (existing > 0) {
      return NextResponse.json({
        success: true,
        message: `Skipped — ${existing} products already exist in DB`,
        seeded: 0,
      });
    }

    // Sequential rather than Promise.all: `resolveUniqueSlug` reads the same
    // collection it is about to write, so the checks must not race each other.
    let seeded = 0;
    for (const product of PRODUCTS) {
      const data = buildProductData({ ...product, slug: undefined });
      data.slug = await resolveUniqueSlug(product.slug || product.name);

      await prisma.product.create({ data: data as unknown as Prisma.ProductCreateInput });
      seeded += 1;
    }

    revalidateTag(PRODUCTS_TAG, 'max');
    revalidatePath('/');
    revalidatePath('/shop');

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded} products into MongoDB`,
      seeded,
    });
  } catch (err) {
    console.error('[POST /api/products/seed]', err);
    const message = err instanceof Error ? err.message : 'Failed to seed products';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
