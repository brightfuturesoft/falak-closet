import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CATEGORIES_TAG } from '@/lib/fetcher';
import { INITIAL_CATEGORIES } from '@/data/categories';

// POST /api/categories/seed — seeds DB with INITIAL_CATEGORIES if empty
export async function POST() {
  try {
    const existing = await prisma.category.count();
    if (existing > 0) {
      return NextResponse.json({
        success: true,
        message: `Skipped — ${existing} categories already exist in DB`,
        seeded: 0,
      });
    }

    const results = await Promise.all(
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

    revalidateTag(CATEGORIES_TAG, 'max');
    revalidatePath('/');
    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} categories into MongoDB`,
      seeded: results.length,
    });
  } catch (err) {
    console.error('[POST /api/categories/seed]', err);
    const message = err instanceof Error ? err.message : 'Failed to seed categories';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
