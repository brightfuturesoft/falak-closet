import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';
import {
  buildProductData,
  queryProducts,
  serializeProduct,
  ProductValidationError,
  type ProductSort,
} from '@/lib/products';

const SORTS: ProductSort[] = ['newest', 'price-low', 'price-high', 'rating', 'name'];

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

/**
 * Invalidate every cached read of the catalog after a write.
 * Next 16 requires the second `profile` argument on revalidateTag —
 * 'max' gives stale-while-revalidate instead of a blocking cache miss.
 */
function bustProductCache() {
  revalidateTag(PRODUCTS_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/shop');
}

// ─── GET /api/products?category=&subCategory=&q=&sort=&limit= ─────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sortParam = searchParams.get('sort');
    const limitParam = Number(searchParams.get('limit'));

    const products = await queryProducts({
      category: searchParams.get('category') ?? undefined,
      subCategory: searchParams.get('subCategory') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      sort: SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : undefined,
      limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    });

    return NextResponse.json({ success: true, products });
  } catch (err) {
    // Deliberately a real 500: returning `{ success: true, products: [] }` here
    // would make a dead database indistinguishable from an empty catalog.
    console.error('[GET /api/products]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// ─── POST /api/products ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = buildProductData(body);

    const existing = await prisma.product.findUnique({ where: { slug: data.slug as string } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A product with the slug "${data.slug}" already exists` },
        { status: 409 }
      );
    }

    const created = await prisma.product.create({
      data: data as unknown as Prisma.ProductCreateInput,
    });

    bustProductCache();
    return NextResponse.json(
      { success: true, message: 'Product created', product: serializeProduct(created) },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error('[POST /api/products]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
