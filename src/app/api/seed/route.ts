import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CATEGORIES_TAG, PRODUCTS_TAG } from '@/lib/fetcher';
import { buildProductData, resolveUniqueSlug } from '@/lib/products';
import { PRODUCTS } from '@/data/products';
import { INITIAL_CATEGORIES } from '@/data/categories';
import { DEFAULT_COUPONS } from '@/data/promotions';

/**
 * POST /api/seed          — seeds products, categories and coupons *if empty*
 * POST /api/seed?reset=true — wipes those three collections first
 *
 * The wipe is behind a flag on purpose: this route used to `deleteMany({})`
 * unconditionally, so a routine "seed the demo data" call destroyed the live
 * catalog. Orders and users are never touched by either mode.
 */
export async function POST(req: Request) {
  try {
    const reset = new URL(req.url).searchParams.get('reset') === 'true';

    if (reset) {
      await prisma.product.deleteMany({});
      await prisma.promotion.deleteMany({});
      await prisma.category.deleteMany({});
    }

    // ── Products ──────────────────────────────────────────────────────────────
    let products = 0;
    if ((await prisma.product.count()) === 0) {
      // Sequential: `resolveUniqueSlug` reads the collection it is about to
      // write, so parallel inserts could hand out the same slug twice.
      for (const product of PRODUCTS) {
        const data = buildProductData({ ...product, slug: undefined });
        data.slug = await resolveUniqueSlug(product.slug || product.name);
        await prisma.product.create({ data: data as unknown as Prisma.ProductCreateInput });
        products += 1;
      }
    }

    // ── Categories ────────────────────────────────────────────────────────────
    let categories = 0;
    if ((await prisma.category.count()) === 0) {
      const created = await Promise.all(
        INITIAL_CATEGORIES.map((cat, idx) =>
          prisma.category.create({
            data: {
              name: cat.name,
              slug: cat.slug,
              icon: cat.icon ?? 'Tag',
              description: cat.description ?? '',
              image: cat.image ?? '',
              isFeatured: cat.isFeatured ?? false,
              sortOrder: idx,
              subCategories: (cat.subCategories || []).map((s) => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
                description: s.description ?? '',
              })),
            },
          })
        )
      );
      categories = created.length;
    }

    // ── Coupons ───────────────────────────────────────────────────────────────
    // DEFAULT_COUPONS, not PROMOTIONS: the latter are marketing banners and
    // writing them here produced coupon records /validate could not read.
    let coupons = 0;
    if ((await prisma.promotion.count()) === 0) {
      const created = await prisma.promotion.createMany({ data: DEFAULT_COUPONS });
      coupons = created.count;
    }

    revalidateTag(PRODUCTS_TAG, 'max');
    revalidateTag(CATEGORIES_TAG, 'max');
    revalidatePath('/');
    revalidatePath('/shop');

    return NextResponse.json({
      success: true,
      reset,
      seeded: { products, categories, coupons },
      message:
        products + categories + coupons === 0
          ? 'Nothing to seed — all collections already have data'
          : `Seeded ${products} products, ${categories} categories, ${coupons} coupons`,
    });
  } catch (err) {
    console.error('[POST /api/seed]', err);
    const message = err instanceof Error ? err.message : 'Failed to seed database';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
