import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';
import { isObjectId } from '@/lib/products';

/**
 * POST /api/products/[id]/reviews — public review submission.
 *
 * New reviews land as `status: 'pending'` and appear on the storefront only
 * after an admin approves them (Admin → Reviews). Nothing about the request
 * is trusted: rating is clamped, strings are trimmed and length-capped.
 */

type RouteContext = { params: Promise<{ id: string }> };

// Naive in-memory throttle: one submission per IP per minute. Fine for a
// single-instance deployment; swap for Redis if the app ever scales out.
const SUBMIT_COOLDOWN_MS = 60_000;
const lastSubmitAt = new Map<string, number>();

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const ip = clientIp(req);
    const last = lastSubmitAt.get(ip) ?? 0;
    if (Date.now() - last < SUBMIT_COOLDOWN_MS) {
      return NextResponse.json(
        { success: false, error: 'Please wait a minute before submitting another review.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const author = String(body?.author ?? '').trim().slice(0, 60);
    const comment = String(body?.comment ?? '').trim().slice(0, 1000);
    const rating = Number(body?.rating);
    const email = String(body?.email ?? '').trim().toLowerCase();
    const phone = String(body?.phone ?? '').trim();

    if (!author) {
      return NextResponse.json({ success: false, error: 'Your name is required.' }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5 stars.' }, { status: 400 });
    }
    if (comment.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please write a few words about the product (at least 5 characters).' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: isObjectId(id) ? { OR: [{ id }, { slug: id }] } : { slug: id },
      select: { id: true, slug: true, reviewsList: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Verify delivered purchase
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to submit a review.' },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'Delivered',
        OR: [
          ...(email ? [{ userEmail: { equals: email, mode: 'insensitive' as const } }] : []),
          ...(phone ? [{ shippingAddress: { is: { phone: phone } } }] : []),
        ],
      },
      select: {
        items: true,
      },
    });

    const hasPurchasedAndDelivered = orders.some((o) =>
      o.items.some((item: any) => {
        const itemProd = item?.product;
        return itemProd?.id === product.id || itemProd?.slug === product.slug;
      })
    );

    if (!hasPurchasedAndDelivered) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only customers who have purchased and received delivery of this product can submit a review.',
        },
        { status: 403 }
      );
    }

    const review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      rating: Math.round(rating),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      comment,
      verifiedPurchase: true, // verified programmatically above
      status: 'pending',
    };

    await prisma.product.update({
      where: { id: product.id },
      // Prepend so the admin queue shows newest submissions first.
      data: { reviewsList: { push: [review] } },
    });

    lastSubmitAt.set(ip, Date.now());

    revalidateTag(PRODUCTS_TAG, 'max');
    revalidatePath(`/product/${product.slug}`);

    return NextResponse.json(
      { success: true, message: 'Thank you! Your review is awaiting approval and will appear shortly.', review },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/products/[id]/reviews]', err);
    return NextResponse.json(
      { success: false, error: 'Could not submit the review — please try again.' },
      { status: 500 }
    );
  }
}
