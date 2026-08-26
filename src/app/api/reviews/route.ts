import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';

/**
 * Admin review moderation.
 *
 * Reviews live inside each product's `reviewsList` (embedded), so every
 * operation targets {productId, reviewId}. Approving or deleting recomputes
 * the product's public rating/reviewCount from its APPROVED reviews only.
 */

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

function bustCache(slug: string | null) {
  revalidateTag(PRODUCTS_TAG, 'max');
  if (slug) revalidatePath(`/product/${slug}`);
}

interface AdminReview {
  productId: string;
  productName: string;
  productSlug: string;
  review: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
    verifiedPurchase: boolean;
    status: string | null;
  };
}

// ─── GET /api/reviews?status=pending|approved|all ────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, reviewsList: true },
      orderBy: { createdAt: 'desc' },
    });

    const reviews: AdminReview[] = [];
    for (const p of products) {
      for (const r of p.reviewsList || []) {
        // Absent status = approved (pre-moderation / seeded reviews).
        const effective = r.status ?? 'approved';
        if (status !== 'all' && effective !== status) continue;
        reviews.push({
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          review: {
            id: r.id,
            author: r.author,
            rating: r.rating,
            date: r.date,
            comment: r.comment,
            verifiedPurchase: r.verifiedPurchase,
            status: effective,
          },
        });
      }
    }

    // Newest first — submissions push to the end of the array.
    reviews.reverse();

    return NextResponse.json({ success: true, reviews, pendingCount: reviews.filter((r) => r.review.status === 'pending').length });
  } catch (err) {
    console.error('[GET /api/reviews]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/** Recompute public rating/count from approved reviews and persist. */
async function recomputeAggregates(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { reviewsList: true, rating: true },
  });
  if (!product) return;

  const approved = (product.reviewsList || []).filter((r) => (r.status ?? 'approved') === 'approved');
  if (approved.length === 0) {
    // No approved reviews left → leave the seeded/default rating untouched.
    await prisma.product.update({
      where: { id: productId },
      data: { reviewCount: 0 },
    });
    return;
  }

  const avg = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round(avg * 10) / 10,
      reviewCount: approved.length,
    },
  });
}

// ─── PATCH /api/reviews — body { productId, reviewId, status } ──────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body?.productId ?? '').trim();
    const reviewId = String(body?.reviewId ?? '').trim();
    const status = String(body?.status ?? '').trim();

    if (!productId || !reviewId) {
      return NextResponse.json({ success: false, error: 'productId and reviewId are required' }, { status: 400 });
    }
    if (!['approved', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, error: "status must be 'approved' or 'pending'" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const target = (product.reviewsList || []).find((r) => r.id === reviewId);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        reviewsList: (product.reviewsList || []).map((r) =>
          r.id === reviewId ? { ...r, status } : r
        ),
      },
    });

    await recomputeAggregates(productId);
    bustCache(product.slug);

    return NextResponse.json({ success: true, message: `Review ${status}` });
  } catch (err) {
    console.error('[PATCH /api/reviews]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/reviews?productId=...&reviewId=... ──────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = String(searchParams.get('productId') || '').trim();
    const reviewId = String(searchParams.get('reviewId') || '').trim();

    if (!productId || !reviewId) {
      return NextResponse.json({ success: false, error: 'productId and reviewId are required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const remaining = (product.reviewsList || []).filter((r) => r.id !== reviewId);
    if (remaining.length === (product.reviewsList || []).length) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { reviewsList: remaining },
    });

    await recomputeAggregates(productId);
    bustCache(product.slug);

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('[DELETE /api/reviews]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
