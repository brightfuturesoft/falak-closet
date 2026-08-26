import type { PromotionBanner as PromotionBannerRow } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { PROMOTION_BANNERS_TAG } from '@/lib/fetcher';
import { DEFAULT_BANNERS } from '@/data/promotions';

export interface PromotionBanner {
  id: string;
  title: string;
  subtitle: string;
  discountBadge: string;
  code: string | null;
  bannerImage: string;
  categoryFilter: string | null;
  minSpend: number | null;
  isFlashSale: boolean;
  flashSaleEndsAt: string | null; // ISO string representation
  terms: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function serializeBanner(row: PromotionBannerRow): PromotionBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    discountBadge: row.discountBadge,
    code: row.code,
    bannerImage: row.bannerImage,
    categoryFilter: row.categoryFilter,
    minSpend: row.minSpend,
    isFlashSale: row.isFlashSale,
    flashSaleEndsAt: row.flashSaleEndsAt ? row.flashSaleEndsAt.toISOString() : null,
    terms: row.terms,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

export const getActiveBanners = unstable_cache(
  async (): Promise<PromotionBanner[]> => {
    const count = await prisma.promotionBanner.count();
    if (count === 0) {
      await prisma.promotionBanner.createMany({ data: getSeedBanners() });
    }
    const rows = await prisma.promotionBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    return rows.map(serializeBanner);
  },
  ['banners:active'],
  { tags: [PROMOTION_BANNERS_TAG], revalidate: 3600 }
);

export const getAllBanners = unstable_cache(
  async (): Promise<PromotionBanner[]> => {
    const count = await prisma.promotionBanner.count();
    if (count === 0) {
      await prisma.promotionBanner.createMany({ data: getSeedBanners() });
    }
    const rows = await prisma.promotionBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    return rows.map(serializeBanner);
  },
  ['banners:all'],
  { tags: [PROMOTION_BANNERS_TAG], revalidate: 3600 }
);
