/**
 * fetcher.ts — Reusable typed fetch utility for Falak Closet
 *
 * Works in both Server Components (with Next.js cache/revalidation)
 * and Client Components (standard fetch).
 *
 * Usage (server):
 *   const categories = await fetchCategories(); // cached, revalidates every 60s
 *
 * Usage (client):
 *   const res = await apiFetch<CategoriesResponse>('/api/categories');
 *   if (res.success) console.log(res.data.categories);
 */

import type { Category } from '@/data/categories';
import type { Product } from '@/data/products';

export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

interface FetchOptions extends Omit<RequestInit, 'next'> {
  /** Seconds until the cached response is revalidated. Omit for an uncached request. */
  revalidate?: number;
  /** Next.js cache tags for on-demand revalidation via revalidateTag(). */
  tags?: string[];
}

/**
 * Relative URLs work in the browser but Node's fetch requires an absolute one,
 * so on the server we resolve against the deployment origin.
 */
function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window !== 'undefined') return path;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`);

  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Low-level typed fetch wrapper. Never throws — always returns an ApiResponse. */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { revalidate, tags, ...init } = options;

  // In Next 16 fetch is uncached by default, so caching is opt-in per request.
  const isCached = revalidate !== undefined || Boolean(tags?.length);

  try {
    const res = await fetch(resolveUrl(url), {
      ...init,
      ...(isCached
        ? {
            cache: 'force-cache' as const,
            next: {
              ...(revalidate !== undefined ? { revalidate } : {}),
              ...(tags?.length ? { tags } : {}),
            },
          }
        : {}),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return { success: false, error: body?.error ?? `HTTP ${res.status} ${res.statusText}` };
    }

    return { success: true, data: body as T };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'Network error' };
  }
}

// ─── Domain helpers ────────────────────────────────────────────────────────

/** Cache tag shared by every categories read + every categories mutation. */
export const CATEGORIES_TAG = 'categories';

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  error?: string;
}

/**
 * Fetch all categories (with their embedded subcategories).
 * Cached and tagged with `categories`, so any admin mutation that calls
 * revalidateTag('categories', 'max') refreshes it on the next visit.
 */
export async function fetchCategories(opts?: { noCache?: boolean }): Promise<Category[]> {
  const result = await apiFetch<CategoriesResponse>(
    '/api/categories',
    opts?.noCache
      ? { cache: 'no-store' }
      : { revalidate: 60, tags: [CATEGORIES_TAG] }
  );

  if (!result.success) {
    console.error('[fetchCategories]', result.error);
    return [];
  }

  return result.data.categories ?? [];
}

// ─── Products ──────────────────────────────────────────────────────────────

/**
 * Cache tag shared by every products read + every products mutation.
 * Server reads live in `src/lib/products.ts` (direct Prisma + unstable_cache);
 * the tag is declared here so both sides import the same string.
 */
export const PRODUCTS_TAG = 'products';
export const PROMOTION_BANNERS_TAG = 'promotion-banners';
export const HERO_SLIDES_TAG = 'hero-slides';

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  error?: string;
}

/** Client-side products read. Admin callers should pass `noCache` to bypass the cache. */
export async function fetchProducts(opts?: { noCache?: boolean }): Promise<Product[]> {
  const result = await apiFetch<ProductsResponse>(
    '/api/products',
    opts?.noCache ? { cache: 'no-store' } : { revalidate: 60, tags: [PRODUCTS_TAG] }
  );

  if (!result.success) {
    console.error('[fetchProducts]', result.error);
    return [];
  }

  return result.data.products ?? [];
}
