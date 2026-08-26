import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PROMOTION_BANNERS_TAG } from '@/lib/fetcher';
import { DEFAULT_BANNERS } from '@/data/promotions';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

function bustBannerCache() {
  revalidateTag(PROMOTION_BANNERS_TAG, 'max');
  revalidatePath('/live-promotions');
  revalidatePath('/');
}

function getSeedBanners() {
  return DEFAULT_BANNERS.map((b) => {
    let flashSaleEndsAt: Date | null = null;
    if (b.flashSaleHoursOffset) {
      flashSaleEndsAt = new Date(Date.now() + b.flashSaleHoursOffset * 60 * 60 * 1000);
    } else if (b.flashSaleDaysOffset) {
      flashSaleEndsAt = new Date(Date.now() + b.flashSaleDaysOffset * 24 * 60 * 60 * 1000);
    }

    return {
      title: b.title,
      subtitle: b.subtitle,
      discountBadge: b.discountBadge,
      code: b.code,
      bannerImage: b.bannerImage,
      categoryFilter: b.categoryFilter,
      minSpend: b.minSpend,
      isFlashSale: b.isFlashSale,
      flashSaleEndsAt,
      terms: b.terms,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    };
  });
}

// ─── GET /api/promotion-banners ──────────────────────────────────────────────
export async function GET() {
  try {
    let banners = await prisma.promotionBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });

    if (banners.length === 0) {
      await prisma.promotionBanner.createMany({ data: getSeedBanners() });
      banners = await prisma.promotionBanner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      });
      // Bust cache to reflect the seeded data in cache
      bustBannerCache();
    }

    return NextResponse.json({ success: true, banners });
  } catch (err) {
    console.error('[GET /api/promotion-banners]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// ─── POST /api/promotion-banners ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const minSpend = body.minSpend !== undefined && body.minSpend !== null && body.minSpend !== '' ? Number(body.minSpend) : null;
    if (minSpend !== null && (!Number.isFinite(minSpend) || minSpend < 0)) {
      return NextResponse.json({ success: false, error: 'Minimum spend must be a non-negative number' }, { status: 400 });
    }

    let flashSaleEndsAt: Date | null = null;
    if (body.flashSaleEndsAt) {
      flashSaleEndsAt = new Date(body.flashSaleEndsAt);
      if (isNaN(flashSaleEndsAt.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid flash sale end date' }, { status: 400 });
      }
    }

    const code = body.code ? String(body.code).trim().toUpperCase() : null;

    const banner = await prisma.promotionBanner.create({
      data: {
        title,
        subtitle: String(body.subtitle || '').trim(),
        discountBadge: String(body.discountBadge || '').trim(),
        code,
        bannerImage: String(body.bannerImage || '').trim(),
        categoryFilter: body.categoryFilter ? String(body.categoryFilter).trim() : null,
        minSpend,
        isFlashSale: Boolean(body.isFlashSale),
        flashSaleEndsAt,
        terms: String(body.terms || '').trim(),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        sortOrder: Number(body.sortOrder) || 0,
      }
    });

    bustBannerCache();

    return NextResponse.json({ success: true, message: 'Banner created successfully', banner }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/promotion-banners]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PATCH /api/promotion-banners ────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || body._id || '').trim();
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: 'Valid ID is required' }, { status: 400 });
    }

    const existing = await prisma.promotionBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }

    const data: Prisma.PromotionBannerUpdateInput = {};

    if (body.title !== undefined) {
      const title = String(body.title || '').trim();
      if (!title) {
        return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
      }
      data.title = title;
    }

    if (body.subtitle !== undefined) data.subtitle = String(body.subtitle || '').trim();
    if (body.discountBadge !== undefined) data.discountBadge = String(body.discountBadge || '').trim();
    if (body.code !== undefined) {
      data.code = body.code ? String(body.code).trim().toUpperCase() : null;
    }
    if (body.bannerImage !== undefined) data.bannerImage = String(body.bannerImage || '').trim();
    if (body.categoryFilter !== undefined) {
      data.categoryFilter = body.categoryFilter ? String(body.categoryFilter).trim() : null;
    }

    if (body.minSpend !== undefined) {
      const minSpend = body.minSpend !== null && body.minSpend !== '' ? Number(body.minSpend) : null;
      if (minSpend !== null && (!Number.isFinite(minSpend) || minSpend < 0)) {
        return NextResponse.json({ success: false, error: 'Minimum spend must be a non-negative number' }, { status: 400 });
      }
      data.minSpend = minSpend;
    }

    if (body.isFlashSale !== undefined) data.isFlashSale = Boolean(body.isFlashSale);

    if (body.flashSaleEndsAt !== undefined) {
      if (body.flashSaleEndsAt) {
        const date = new Date(body.flashSaleEndsAt);
        if (isNaN(date.getTime())) {
          return NextResponse.json({ success: false, error: 'Invalid flash sale end date' }, { status: 400 });
        }
        data.flashSaleEndsAt = date;
      } else {
        data.flashSaleEndsAt = null;
      }
    }

    if (body.terms !== undefined) data.terms = String(body.terms || '').trim();
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

    const banner = await prisma.promotionBanner.update({ where: { id }, data });

    bustBannerCache();

    return NextResponse.json({ success: true, message: 'Banner updated successfully', banner });
  } catch (err) {
    console.error('[PATCH /api/promotion-banners]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/promotion-banners?id=... ────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get('id') || '').trim();
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: 'Valid ID is required for deletion' }, { status: 400 });
    }

    const existing = await prisma.promotionBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }

    await prisma.promotionBanner.delete({ where: { id } });

    bustBannerCache();

    return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/promotion-banners]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
