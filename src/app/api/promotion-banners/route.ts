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
export async function GET(req: Request) {
  try {
    const fetchBanners = () =>
      prisma.promotionBanner.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      });

    let banners = await fetchBanners();

    if (banners.length === 0) {
      await prisma.promotionBanner.createMany({ data: getSeedBanners() });
      banners = await fetchBanners();
      // Bust cache to reflect the seeded data in cache
      bustBannerCache();
    }

    const { searchParams } = new URL(req.url);
    if (!searchParams.has('page') && !searchParams.has('pageSize')) {
      return NextResponse.json({ success: true, banners });
    }

    // ── Server-paginated admin view ────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '8', 10) || 8));
    const filter = ['all', 'active', 'inactive', 'flash'].includes(searchParams.get('filter') || '')
      ? searchParams.get('filter')!
      : 'all';
    const query = (searchParams.get('query') || '').trim().toLowerCase();
    const sort = ['sort', 'created', 'title'].includes(searchParams.get('sort') || '')
      ? searchParams.get('sort')!
      : 'sort';
    const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

    const now = Date.now();
    const isLiveFlash = (b: (typeof banners)[number]) =>
      Boolean(b.isFlashSale && b.flashSaleEndsAt && new Date(b.flashSaleEndsAt).getTime() > now);

    const counts = {
      all: banners.length,
      active: banners.filter((b) => b.isActive).length,
      inactive: banners.filter((b) => !b.isActive).length,
      flash: banners.filter(isLiveFlash).length,
    };

    const searched = query
      ? banners.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            (b.code || '').toLowerCase().includes(query) ||
            (b.subtitle || '').toLowerCase().includes(query)
        )
      : banners;

    const filtered =
      filter === 'all'
        ? searched
        : filter === 'flash'
          ? searched.filter(isLiveFlash)
          : searched.filter((b) => (filter === 'active' ? b.isActive : !b.isActive));

    const dirMul = dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sort) {
        case 'created':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dirMul;
        case 'title':
          return a.title.localeCompare(b.title) * dirMul;
        case 'sort':
        default:
          return ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)) * dirMul;
      }
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return NextResponse.json({
      success: true,
      banners: pageRows,
      pagination: { page: safePage, pageSize, totalItems, totalPages },
      counts,
      stats: {
        total: banners.length,
        live: counts.active,
        flashLive: counts.flash,
        withCodes: banners.filter((b) => b.code).length,
      },
    });
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
