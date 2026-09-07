import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PRODUCTS_TAG } from '@/lib/fetcher';
import { isAdminAuthenticated } from '@/lib/session';
import {
  buildProductData,
  resolveUniqueSlug,
  queryProducts,
  serializeProduct,
  sanitizeProductForPublic,
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

// ─── GET /api/products ───────────────────────────────────────────────────────
// Without page/pageSize: legacy full-catalog `{ products }` response (CartContext,
// SettingsTab, and the admin dashboard context rely on it).
//
// With page/pageSize: server-paginated admin inventory view —
//   GET /api/products?page=2&pageSize=8&category=Hijabs&subCategory=Chiffon
//                        &stock=low&query=red&sort=price&dir=asc
//   → { products: [...one page...], pagination, counts, stats }
//   stock: all | in (≥5) | low (1–4) | out (0)      sort: newest | name | price | stock | rating
//   pageSize caps at 100 for views and 500 for CSV/export use; page clamps.
const STOCK_FILTERS = ['all', 'in', 'low', 'out'] as const;
const PRODUCT_SORTS = ['newest', 'name', 'price', 'stock', 'rating'] as const;

export async function GET(req: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    const { searchParams } = new URL(req.url);

    // Legacy mode: unchanged queryProducts behaviour for full-catalog callers.
    if (!searchParams.has('page') && !searchParams.has('pageSize')) {
      const sortParam = searchParams.get('sort');
      const limitParam = Number(searchParams.get('limit'));

      const products = await queryProducts({
        category: searchParams.get('category') ?? undefined,
        subCategory: searchParams.get('subCategory') ?? undefined,
        q: searchParams.get('q') ?? undefined,
        sort: SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : undefined,
        limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
      });

      const result = isAdmin ? products : products.map(sanitizeProductForPublic);
      return NextResponse.json({ success: true, products: result });
    }

    const rows = await prisma.product.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
    const products = rows.map(serializeProduct);

    // ── Paginated admin mode ────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '8', 10) || 8));
    const category = searchParams.get('category') || 'All';
    const subCategory = searchParams.get('subCategory') || 'All';
    const rawStock = searchParams.get('stock') || 'all';
    const stock = (STOCK_FILTERS as readonly string[]).includes(rawStock) ? rawStock : 'all';
    const query = (searchParams.get('query') || '').trim().toLowerCase();
    const rawSort = searchParams.get('sort') || 'newest';
    const sort = [...PRODUCT_SORTS, 'price-low', 'price-high'].includes(rawSort) ? rawSort : 'newest';
    const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

    const stockOf = (p: (typeof products)[number]) => p.stock ?? 10;
    const stockTier = (p: (typeof products)[number]): 'in' | 'low' | 'out' => {
      const s = stockOf(p);
      if (s === 0) return 'out';
      return s < 5 ? 'low' : 'in';
    };

    // Pill counts over the ENTIRE catalog (search-independent, matching the
    // previous client-side pills), plus KPI stats.
    const categoryCounts: Record<string, number> = {};
    const subCategoryCounts: Record<string, Record<string, number>> = {};
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;
    let totalUnits = 0;
    for (const p of products) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      if (p.subCategory) {
        subCategoryCounts[p.category] = subCategoryCounts[p.category] || {};
        subCategoryCounts[p.category][p.subCategory] = (subCategoryCounts[p.category][p.subCategory] || 0) + 1;
      }
      const tier = stockTier(p);
      if (tier === 'in') inStock += 1;
      else if (tier === 'low') lowStock += 1;
      else outOfStock += 1;
      inventoryValue += p.price * stockOf(p);
      totalUnits += stockOf(p);
    }

    // Search across the same fields the previous client filter used.
    const searched = query
      ? products.filter((p) => {
          const colorHit = p.colors?.some(
            (c) =>
              c.name.toLowerCase().includes(query) ||
              (c.hex && c.hex.toLowerCase().includes(query))
          );
          const varHit = p.variations?.some(
            (v) =>
              v.colorName.toLowerCase().includes(query) ||
              (v.colorHex && v.colorHex.toLowerCase().includes(query)) ||
              (v.size && v.size.toLowerCase() === query)
          );
          return (
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.code || '').toLowerCase().includes(query) ||
            (p.material || '').toLowerCase().includes(query) ||
            (p.workType || '').toLowerCase().includes(query) ||
            colorHit ||
            varHit
          );
        })
      : products;

    const filtered = searched.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (subCategory !== 'All' && p.subCategory !== subCategory) return false;
      if (stock !== 'all' && stockTier(p) !== stock) return false;
      return true;
    });

    const dirMul = dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name) * dirMul;
        case 'price':
        case 'price-low':
        case 'price-high':
          return (a.price - b.price) * dirMul;
        case 'stock':
          return (stockOf(a) - stockOf(b)) * dirMul;
        case 'rating':
          return ((a.rating || 0) - (b.rating || 0)) * dirMul;
        case 'newest':
        default:
          return (
            (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dirMul
          );
      }
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return NextResponse.json({
      success: true,
      products: isAdmin ? pageRows : pageRows.map(sanitizeProductForPublic),
      pagination: { page: safePage, pageSize, totalItems, totalPages },
      counts: { categories: categoryCounts, subCategories: subCategoryCounts },
      stats: {
        total: products.length,
        inStock,
        lowStock,
        outOfStock,
        inventoryValue,
        totalUnits,
      },
    });
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

    // Automatically ensure slug is unique across catalog
    data.slug = await resolveUniqueSlug(data.slug as string);

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
