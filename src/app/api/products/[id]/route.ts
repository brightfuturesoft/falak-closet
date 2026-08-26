import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';
import {
  buildProductData,
  isObjectId,
  serializeProduct,
  ProductValidationError,
} from '@/lib/products';

type RouteContext = { params: Promise<{ id: string }> };

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

function bustProductCache(slug?: string) {
  revalidateTag(PRODUCTS_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/shop');
  if (slug) revalidatePath(`/product/${slug}`);
}

/**
 * Resolve the `[id]` segment to a real row.
 *
 * It may be an ObjectId (admin table, `product.id`) or a slug (storefront links,
 * and every document written before the Prisma migration, whose old string id is
 * now just an ignored extra field).
 */
async function findProduct(key: string) {
  if (!key) return null;
  return prisma.product.findFirst({
    where: isObjectId(key) ? { OR: [{ id: key }, { slug: key }] } : { slug: key },
  });
}

const notFound = () =>
  NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

// ─── GET /api/products/[id] ──────────────────────────────────────────────────
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = await findProduct(id);
    if (!product) return notFound();

    return NextResponse.json({ success: true, product: serializeProduct(product) });
  } catch (err) {
    console.error('[GET /api/products/[id]]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PUT / PATCH /api/products/[id] ──────────────────────────────────────────
// Both are partial updates: only the keys present in the body are written, so a
// stock-only PATCH cannot blank out the rest of the product.
async function update(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const existing = await findProduct(id);
    if (!existing) return notFound();

    const body = await req.json();
    const data = buildProductData(body, { partial: true });

    // slug is @unique — a rename must not collide with another product.
    if (typeof data.slug === 'string' && data.slug !== existing.slug) {
      const clash = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (clash && clash.id !== existing.id) {
        return NextResponse.json(
          { success: false, error: 'Another product already uses this slug' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: data as unknown as Prisma.ProductUpdateInput,
    });

    bustProductCache(updated.slug);
    if (existing.slug !== updated.slug) bustProductCache(existing.slug);

    return NextResponse.json({
      success: true,
      message: 'Product updated',
      product: serializeProduct(updated),
    });
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error('[PUT /api/products/[id]]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

export const PUT = update;
export const PATCH = update;

// ─── DELETE /api/products/[id] ───────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const existing = await findProduct(id);
    // 404 rather than the old silent success — the admin table needs to know
    // whether the row it just removed was actually deleted.
    if (!existing) return notFound();

    await prisma.product.delete({ where: { id: existing.id } });

    bustProductCache(existing.slug);
    return NextResponse.json({ success: true, message: 'Product deleted', id: existing.id });
  } catch (err) {
    console.error('[DELETE /api/products/[id]]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
