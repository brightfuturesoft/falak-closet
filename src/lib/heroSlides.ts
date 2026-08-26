/**
 * heroSlides.ts — server-side hero carousel access.
 *
 * Modeled on promotionBanners.ts: reads are `unstable_cache`d under
 * HERO_SLIDES_TAG so admin writes can bust them with
 * `revalidateTag(HERO_SLIDES_TAG, 'max')`, and an empty collection seeds
 * itself on first read so the admin starts with something to edit.
 *
 * Import from Server Components and Route Handlers only.
 */

import type { HeroSlide as HeroSlideRow } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { HERO_SLIDES_TAG } from '@/lib/fetcher';

export interface HeroSlideView {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function serializeSlide(row: HeroSlideRow): HeroSlideView {
  return {
    id: row.id,
    tag: row.tag,
    title: row.title,
    subtitle: row.subtitle,
    ctaText: row.ctaText,
    ctaLink: row.ctaLink,
    image: row.image,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The two slides the storefront shipped with — seed payload + DB-down fallback. */
export const DEFAULT_HERO_SLIDES: Omit<HeroSlideView, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    tag: 'FRESH OFFERS',
    title: 'Style picks for every plan',
    subtitle: 'Discover clothing deals, curated collections, and easy checkout in one place.',
    ctaText: 'View Offers',
    ctaLink: '/live-promotions',
    image:
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=85',
    isActive: true,
    sortOrder: 1,
  },
  {
    tag: 'SEASONAL DEALS',
    title: 'New looks with better prices',
    subtitle: 'Explore timely offers across clothes, fabrics, accessories, and more.',
    ctaText: 'Shop Deals',
    ctaLink: '/shop',
    image:
      'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=1600&q=85',
    isActive: true,
    sortOrder: 2,
  },
];

function getSeedSlides() {
  return DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));
}

function fallbackSlides(): HeroSlideView[] {
  // Static stand-ins used only when the database is unreachable — the home
  // page must keep its hero, not 500. `id`/timestamps are synthetic.
  return DEFAULT_HERO_SLIDES.map((s, i) => ({
    ...s,
    id: `fallback-${i + 1}`,
    createdAt: '',
    updatedAt: '',
  }));
}

export const getActiveSlides = unstable_cache(
  async (): Promise<HeroSlideView[]> => {
    const count = await prisma.heroSlide.count();
    if (count === 0) {
      await prisma.heroSlide.createMany({ data: getSeedSlides() });
    }
    const rows = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(serializeSlide);
  },
  ['hero:active'],
  { tags: [HERO_SLIDES_TAG], revalidate: 3600 }
);

export const getAllSlides = unstable_cache(
  async (): Promise<HeroSlideView[]> => {
    const count = await prisma.heroSlide.count();
    if (count === 0) {
      await prisma.heroSlide.createMany({ data: getSeedSlides() });
    }
    const rows = await prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(serializeSlide);
  },
  ['hero:all'],
  { tags: [HERO_SLIDES_TAG], revalidate: 3600 }
);

/**
 * `getActiveSlides()` that never takes the home page down. On failure the
 * static defaults render with the error attached, mirroring getProductsSafe.
 */
export async function getActiveSlidesSafe(): Promise<{
  slides: HeroSlideView[];
  error: string | null;
}> {
  try {
    return { slides: await getActiveSlides(), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    console.error('[hero] slide read failed:', message);
    return { slides: fallbackSlides(), error: message };
  }
}
