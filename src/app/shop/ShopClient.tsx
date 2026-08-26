'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Grid2X2,
  Palette,
  Shirt,
  Tag,
  Sun,
  Search,
  Ruler,
  Layers,
  Wallet,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';
import { INITIAL_CATEGORIES } from '@/data/categories';
import { useCategories } from '@/lib/useCategories';
import { filterProducts } from '@/lib/utils';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useCart } from '@/context/CartContext';

/** One selectable filter value, with how many products actually carry it. */
interface Facet {
  value: string;
  count: number;
  hex?: string;
}

/** A price band derived from the catalog's real min/max. */
interface PriceBand {
  /** URL value, e.g. "1000-2500" — `""` means "any". */
  value: string;
  label: string;
  count: number;
}

/** Matches `norm()` in lib/utils so counts and filtering never disagree. */
function norm(value: string | undefined | null): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', 'FREE SIZE', 'ONE SIZE'];

function sizeRank(size: string): number {
  const idx = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return idx === -1 ? SIZE_ORDER.length : idx;
}

/**
 * Count distinct products per value of a single scalar field.
 * Values are grouped by their normalised form but displayed using the first
 * spelling seen, so "Party wear" and "party-wear" collapse into one facet.
 */
function scalarFacets(products: Product[], key: 'workType' | 'occasion' | 'material' | 'weather'): Facet[] {
  const map = new Map<string, Facet>();

  products.forEach((p) => {
    const raw = (p[key] || '').trim();
    if (!raw) return;
    const id = norm(raw);
    const existing = map.get(id);
    if (existing) existing.count += 1;
    else map.set(id, { value: raw, count: 1 });
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Colours from both `colors[]` and the variation matrix, counted once per product. */
function colorFacets(products: Product[]): Facet[] {
  const map = new Map<string, Facet>();

  products.forEach((p) => {
    const seen = new Set<string>();
    const add = (name: string, hex: string) => {
      const id = norm(name);
      if (!id || seen.has(id)) return;
      seen.add(id);
      const existing = map.get(id);
      if (existing) existing.count += 1;
      else map.set(id, { value: name.trim(), hex: hex || '#000000', count: 1 });
    };

    p.colors?.forEach((c) => add(c.name, c.hex));
    p.variations?.forEach((v) => add(v.colorName, v.colorHex));
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Sizes from both `sizes[]` and the variation matrix, in garment order. */
function sizeFacets(products: Product[]): Facet[] {
  const map = new Map<string, Facet>();

  products.forEach((p) => {
    const seen = new Set<string>();
    const add = (size: string) => {
      const id = norm(size);
      if (!id || seen.has(id)) return;
      seen.add(id);
      const existing = map.get(id);
      if (existing) existing.count += 1;
      else map.set(id, { value: size.trim(), count: 1 });
    };

    p.sizes?.forEach(add);
    p.variations?.forEach((v) => add(v.size));
  });

  return Array.from(map.values()).sort(
    (a, b) => sizeRank(a.value) - sizeRank(b.value) || a.value.localeCompare(b.value)
  );
}

/**
 * Four bands spanning the catalog's actual price range, so the brackets stay
 * meaningful whether the store sells ৳500 scarves or ৳50,000 couture.
 */
function priceBands(products: Product[]): PriceBand[] {
  const prices = products.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length < 2) return [];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max <= min) return [];

  // Round the cut points to something a shopper would recognise.
  const step = (max - min) / 4;
  const round = (n: number) => Math.max(1, Math.round(n / 100) * 100);
  const cuts = [round(min + step), round(min + step * 2), round(min + step * 3)];
  const edges = [0, ...cuts, Number.MAX_SAFE_INTEGER];

  const bands: PriceBand[] = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const lo = edges[i];
    const hi = edges[i + 1];
    const count = prices.filter((n) => n >= lo && (hi === Number.MAX_SAFE_INTEGER ? true : n < hi)).length;
    if (count === 0) continue;

    bands.push({
      value: `${lo}-${hi === Number.MAX_SAFE_INTEGER ? '' : hi}`,
      label:
        hi === Number.MAX_SAFE_INTEGER
          ? `৳${lo.toLocaleString('en-IN')}+`
          : `৳${lo.toLocaleString('en-IN')} – ৳${hi.toLocaleString('en-IN')}`,
      count
    });
  }

  // A single band filters nothing.
  return bands.length > 1 ? bands : [];
}

// ─── Reusable facet list ─────────────────────────────────────────────────────

function FacetList({
  title,
  icon,
  allLabel,
  options,
  activeValue,
  onSelect,
  searchable = false
}: {
  title: string;
  icon: React.ReactNode;
  allLabel: string;
  options: Facet[];
  activeValue: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');

  // Nothing in the catalog carries this attribute — showing an empty filter
  // card just invites clicks that cannot change the results.
  if (options.length === 0) return null;

  const visible = query.trim()
    ? options.filter((o) => o.value.toLowerCase().includes(query.toLowerCase().trim()))
    : options;

  const isActive = (value: string) => norm(activeValue) === norm(value);

  return (
    <div className="p-4 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3">
      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">{icon} {title}</span>
        <span className="text-[10px] text-pink-500 font-normal shrink-0">{options.length} available</span>
      </h4>

      {searchable && options.length > 5 && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-pink-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D92670]"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
        </div>
      )}

      <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1">
        <button
          onClick={() => onSelect('All')}
          className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${
            activeValue === 'All' ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
          }`}
        >
          <span>{allLabel}</span>
        </button>

        {visible.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(isActive(opt.value) ? 'All' : opt.value)}
            className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between gap-2 font-bold cursor-pointer ${
              isActive(opt.value) ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {opt.hex && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-inner shrink-0"
                  style={{ backgroundColor: opt.hex }}
                />
              )}
              <span className="truncate">{opt.value}</span>
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                isActive(opt.value) ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {opt.count}
            </span>
          </button>
        ))}

        {visible.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-stone-400 italic">No match for &quot;{query}&quot;</p>
        )}
      </div>
    </div>
  );
}

// ─── Filter panel (shared by the desktop sidebar and the mobile drawer) ──────

interface Facets {
  colors: Facet[];
  workTypes: Facet[];
  occasions: Facet[];
  materials: Facet[];
  weathers: Facet[];
  sizes: Facet[];
  prices: PriceBand[];
}

/** Structural subset of `Category` — all this panel needs from the taxonomy. */
interface ManagedCategory {
  id: string;
  name: string;
  slug: string;
  subCategories: { id: string; name: string; slug: string }[];
}

function FilterPanel({
  facets,
  catalog,
  managedCategories,
  params,
  setParam,
  setParams
}: {
  facets: Facets;
  catalog: Product[];
  managedCategories: ManagedCategory[];
  params: Record<string, string>;
  setParam: (key: string, value: string) => void;
  setParams: (patch: Record<string, string>) => void;
}) {
  // Selecting a filter deliberately does NOT close the mobile drawer — the
  // result count on the "Show N Results" button updates live, so shoppers can
  // stack filters without reopening the panel each time.
  const pick = (key: string) => (value: string) => setParam(key, value);

  // Categories the catalog actually uses but the Categories tab does not manage
  // — a renamed or deleted category would otherwise strand its products with no
  // way to filter to them.
  const unmanagedCategories = React.useMemo(() => {
    const managed = new Set(managedCategories.flatMap((c) => [norm(c.name), norm(c.slug)]));
    const extras = new Map<string, Facet>();

    catalog.forEach((p) => {
      const raw = (p.category || '').trim();
      if (!raw || managed.has(norm(raw))) return;
      const existing = extras.get(norm(raw));
      if (existing) existing.count += 1;
      else extras.set(norm(raw), { value: raw, count: 1 });
    });

    return Array.from(extras.values()).sort((a, b) => b.count - a.count);
  }, [managedCategories, catalog]);

  const countForCategory = (cat: ManagedCategory) =>
    catalog.filter((p) => norm(p.category) === norm(cat.name) || norm(p.category) === norm(cat.slug)).length;

  const countForSub = (sub: { name: string; slug: string }) =>
    catalog.filter((p) => norm(p.subCategory) === norm(sub.name) || norm(p.subCategory) === norm(sub.slug)).length;

  const catActive = (cat: ManagedCategory) =>
    norm(params.category) === norm(cat.name) || norm(params.category) === norm(cat.slug);

  return (
    <div className="space-y-6">
      {/* Category & Subcategory */}
      <div className="p-4 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3 font-sans">
        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Grid2X2 className="w-3.5 h-3.5 text-[#D92670]" /> Category
          </span>
          {params.subCategory !== 'All' && (
            <span className="text-[10px] font-mono text-[#D92670] font-bold bg-pink-50 px-2 py-0.5 rounded-full truncate max-w-[45%]">
              {params.subCategory}
            </span>
          )}
        </h4>

        <div className="space-y-1.5 text-xs">
          <button
            onClick={() => setParams({ category: 'All', subCategory: 'All' })}
            className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${
              params.category === 'All' ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
            }`}
          >
            <span>All Products</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                params.category === 'All' ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#D92670]'
              }`}
            >
              {catalog.length}
            </span>
          </button>

          {managedCategories.map((cat) => {
            const selected = catActive(cat);

            return (
              <div key={cat.id} className="space-y-1">
                <button
                  onClick={() => {
                    // Both keys in one push: two sequential single-key updates
                    // each rebuilt the URL from the pre-click params, so the
                    // second silently threw away the first.
                    setParams({ category: selected ? 'All' : cat.name, subCategory: 'All' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${
                    selected ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      selected ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#D92670]'
                    }`}
                  >
                    {countForCategory(cat)}
                  </span>
                </button>

                {/* Subcategory tree — expanded only for the selected category */}
                {selected && cat.subCategories.length > 0 && (
                  <div className="pl-3 space-y-1 py-1 border-l-2 border-[#D92670]/40 ml-3">
                    {cat.subCategories.map((sub) => {
                      const subSelected =
                        norm(params.subCategory) === norm(sub.name) || norm(params.subCategory) === norm(sub.slug);

                      return (
                        <button
                          key={sub.id}
                          onClick={() => setParam('subCategory', subSelected ? 'All' : sub.name)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            subSelected ? 'bg-[#9B050B] text-white' : 'text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <span className="truncate">• {sub.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                              subSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700 font-mono'
                            }`}
                          >
                            {countForSub(sub)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {unmanagedCategories.length > 0 && (
            <div className="pt-2 mt-1 border-t border-dashed border-stone-200 space-y-1">
              <p className="px-1 text-[10px] uppercase tracking-wider text-stone-400 font-bold">Other in catalog</p>
              {unmanagedCategories.map((extra) => {
                const selected = norm(params.category) === norm(extra.value);
                return (
                  <button
                    key={extra.value}
                    onClick={() => setParams({ category: selected ? 'All' : extra.value, subCategory: 'All' })}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${
                      selected ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-600 hover:bg-pink-50'
                    }`}
                  >
                    <span className="truncate">{extra.value}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                        selected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {extra.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Price bands */}
      {facets.prices.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-pink-100 shadow-xs space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#D92670]" /> Price Range
          </h4>
          <div className="space-y-1 text-xs">
            <button
              onClick={() => setParam('price', 'All')}
              className={`w-full text-left px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer ${
                params.price === 'All' ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
              }`}
            >
              Any Price
            </button>
            {facets.prices.map((band) => {
              const selected = params.price === band.value;
              return (
                <button
                  key={band.value}
                  onClick={() => setParam('price', selected ? 'All' : band.value)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center justify-between font-bold cursor-pointer ${
                    selected ? 'bg-[#D92670] text-white shadow-xs' : 'text-stone-700 hover:bg-pink-50'
                  }`}
                >
                  <span>{band.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {band.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <FacetList
        title="Color Family"
        icon={<Palette className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Colors"
        options={facets.colors}
        activeValue={params.color}
        onSelect={pick('color')}
        searchable
      />

      <FacetList
        title="Work Type"
        icon={<Shirt className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Work Types"
        options={facets.workTypes}
        activeValue={params.work}
        onSelect={pick('work')}
        searchable
      />

      <FacetList
        title="Occasion"
        icon={<Tag className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Occasions"
        options={facets.occasions}
        activeValue={params.occasion}
        onSelect={pick('occasion')}
        searchable
      />

      <FacetList
        title="Material"
        icon={<Layers className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Materials"
        options={facets.materials}
        activeValue={params.material}
        onSelect={pick('material')}
        searchable
      />

      <FacetList
        title="Season"
        icon={<Sun className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Seasons"
        options={facets.weathers}
        activeValue={params.weather}
        onSelect={pick('weather')}
      />

      <FacetList
        title="Size"
        icon={<Ruler className="w-3.5 h-3.5 text-[#D92670]" />}
        allLabel="All Sizes"
        options={facets.sizes}
        activeValue={params.size}
        onSelect={pick('size')}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

/** URL param → human label, for the active-filter chips. */
const FILTER_LABELS: Record<string, string> = {
  q: 'Search',
  category: 'Category',
  subCategory: 'Subcategory',
  work: 'Work',
  occasion: 'Occasion',
  material: 'Material',
  weather: 'Season',
  color: 'Color',
  size: 'Size',
  price: 'Price',
  wishlist: 'Wishlist'
};

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { wishlist, products, isLoadingProducts, productsError, refreshProductsFromApi } = useCart();

  // Read URL query params
  const qParam = searchParams.get('q') || '';
  const catParam = searchParams.get('category') || 'All';
  const subCategoryParam = searchParams.get('subCategory') || 'All';
  const workParam = searchParams.get('work') || 'All';
  const occasionParam = searchParams.get('occasion') || 'All';
  const matParam = searchParams.get('material') || 'All';
  const colorParam = searchParams.get('color') || 'All';
  const weatherParam = searchParams.get('weather') || 'All';
  const sizeParam = searchParams.get('size') || 'All';
  const priceParam = searchParams.get('price') || 'All';
  const sortParam = searchParams.get('sort') || 'recommended';
  const wishlistParam = searchParams.get('wishlist') === 'true';

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // The catalog. Seeded server-side by the root layout, so it is already
  // populated on first paint — no seed-array fallback anywhere.
  const catalog = products;

  // Managed Categories — live from /api/categories, seed data as offline fallback
  const { categories: managedCategories } = useCategories({ fallback: INITIAL_CATEGORIES });

  // Every filter option, derived from the products actually in the store, with
  // real counts. One pass, recomputed only when the catalog changes.
  const facets: Facets = React.useMemo(
    () => ({
      colors: colorFacets(catalog),
      workTypes: scalarFacets(catalog, 'workType'),
      occasions: scalarFacets(catalog, 'occasion'),
      materials: scalarFacets(catalog, 'material'),
      weathers: scalarFacets(catalog, 'weather'),
      sizes: sizeFacets(catalog),
      prices: priceBands(catalog)
    }),
    [catalog]
  );

  // Update one or many params in a single navigation.
  const setParams = React.useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value === 'All' || value === '' || value === 'recommended' || value === 'false') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      const qs = next.toString();
      router.push(qs ? `/shop?${qs}` : '/shop', { scroll: false });
    },
    [router, searchParams]
  );

  const setParam = React.useCallback(
    (key: string, value: string) => setParams({ [key]: value }),
    [setParams]
  );

  const handleResetFilters = () => router.push('/shop', { scroll: false });

  // Filtered dataset
  const filteredProducts = React.useMemo(() => {
    const [rawMin, rawMax] = priceParam === 'All' ? [] : priceParam.split('-');
    const minPrice = rawMin ? Number(rawMin) : undefined;
    const maxPrice = rawMax ? Number(rawMax) : undefined;

    let list = filterProducts(catalog, {
      category: catParam,
      subCategory: subCategoryParam,
      workType: workParam,
      occasion: occasionParam,
      material: matParam,
      weather: weatherParam,
      color: colorParam,
      size: sizeParam,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      searchQuery: qParam
    });

    if (wishlistParam) {
      const wishlistIds = new Set(wishlist.map((w) => w.id));
      list = list.filter((p) => wishlistIds.has(p.id));
    }

    // Sort logic
    if (sortParam === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortParam === 'rating') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (sortParam === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortParam === 'discount') {
      list.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    }

    return list;
  }, [
    catalog,
    catParam,
    subCategoryParam,
    workParam,
    occasionParam,
    matParam,
    weatherParam,
    colorParam,
    sizeParam,
    priceParam,
    qParam,
    wishlistParam,
    sortParam,
    wishlist
  ]);

  React.useEffect(() => {
    trackEvent('search_query', {
      search_term: qParam || 'catalog_browse',
      category: catParam,
      color: colorParam,
      results_count: filteredProducts.length
    });
  }, [qParam, catParam, colorParam, filteredProducts.length, trackEvent]);

  // Active filters, as removable chips
  const activeChips = React.useMemo(() => {
    const entries: { key: string; label: string; value: string }[] = [];
    const push = (key: string, value: string) => {
      if (value && value !== 'All') entries.push({ key, label: FILTER_LABELS[key] || key, value });
    };

    push('q', qParam);
    push('category', catParam);
    push('subCategory', subCategoryParam);
    push('work', workParam);
    push('occasion', occasionParam);
    push('material', matParam);
    push('weather', weatherParam);
    push('color', colorParam);
    push('size', sizeParam);
    if (priceParam !== 'All') {
      const band = facets.prices.find((b) => b.value === priceParam);
      entries.push({ key: 'price', label: 'Price', value: band?.label || priceParam });
    }
    if (wishlistParam) entries.push({ key: 'wishlist', label: 'Wishlist', value: 'Saved items' });

    return entries;
  }, [
    qParam,
    catParam,
    subCategoryParam,
    workParam,
    occasionParam,
    matParam,
    weatherParam,
    colorParam,
    sizeParam,
    priceParam,
    wishlistParam,
    facets.prices
  ]);

  const hasActiveFilters = activeChips.length > 0;
  const panelParams = {
    category: catParam,
    subCategory: subCategoryParam,
    work: workParam,
    occasion: occasionParam,
    material: matParam,
    weather: weatherParam,
    color: colorParam,
    size: sizeParam,
    price: priceParam
  };

  const isEmptyCatalog = catalog.length === 0;
  const isBusy = isLoadingProducts && isEmptyCatalog;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 pb-32 lg:pb-12 text-stone-900">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-pink-100 pb-6 gap-4">
        <div>
          <span className="px-3.5 py-1 bg-pink-100 text-[#D92670] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Haute Couture Catalog
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2">
            {catParam === 'All' ? 'Complete Collection' : `${catParam} Collection`}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isBusy ? (
              <span>Loading the catalog…</span>
            ) : (
              <>
                Showing <strong className="text-stone-900 font-bold">{filteredProducts.length}</strong> of{' '}
                {catalog.length} luxurious modest designs
                {qParam && (
                  <span>
                    {' '}matching &quot;<strong className="text-[#D92670]">{qParam}</strong>&quot;
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Top Controls: Mobile Filter Drawer Button & Desktop Sorting */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden px-4 py-2.5 bg-white border border-pink-200 text-[#D92670] text-xs font-bold rounded-full hover:bg-pink-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters{hasActiveFilters ? ` (${activeChips.length})` : ''}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider hidden sm:inline">Sort By:</span>
            <select
              value={sortParam}
              onChange={(e) => setParam('sort', e.target.value)}
              className="px-4 py-2 bg-white border border-pink-200 rounded-full text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D92670] shadow-xs cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">New Arrivals</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog read failed — say so instead of showing an empty grid. */}
      {productsError && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-800">
          <p className="text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            The catalog could not be loaded{isEmptyCatalog ? '' : ' — showing the last known products'}. {productsError}
          </p>
          <button
            onClick={() => refreshProductsFromApi()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={`${chip.key}:${chip.value}`}
              onClick={() => setParam(chip.key, chip.key === 'wishlist' ? 'false' : 'All')}
              className="pl-3 pr-2 py-1.5 bg-white border border-pink-200 rounded-full text-[11px] font-bold text-stone-700 hover:border-[#D92670] hover:text-[#D92670] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="text-stone-400 uppercase tracking-wider">{chip.label}:</span>
              <span className="truncate max-w-[10rem]">{chip.value}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-[11px] font-bold text-[#D92670] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear all
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-pink-100">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D92670]" /> Filter Catalog
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#D92670] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            )}
          </div>

          {isEmptyCatalog ? (
            <p className="text-xs text-stone-400 italic px-1">
              Filters appear once the catalog has products.
            </p>
          ) : (
            <FilterPanel
              facets={facets}
              catalog={catalog}
              managedCategories={managedCategories}
              params={panelParams}
              setParam={setParam}
              setParams={setParams}
            />
          )}
        </aside>

        {/* Products Grid Section */}
        <main className="lg:col-span-9 space-y-6">
          {isBusy ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="aspect-[3/4] bg-stone-200 rounded-2xl" />
                  <div className="h-3 bg-stone-200 rounded-full w-3/4" />
                  <div className="h-3 bg-stone-200 rounded-full w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-pink-100 p-8 space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-[#D92670]">
                <Sparkles className="w-8 h-8" />
              </div>
              {isEmptyCatalog ? (
                <>
                  <h3 className="text-lg font-bold text-stone-900">The collection is being prepared</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    No designs have been published yet. Please check back shortly.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-stone-900">No designs match your active filters</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Try removing a filter above or resetting your search to discover more items.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 bg-[#D92670] hover:bg-[#C2185B] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Modal — same panel as desktop, so the two can
          never drift apart the way the old hardcoded category list did. */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full overflow-y-auto p-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-pink-100 shrink-0">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D92670]" /> Catalog Filters
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              {isEmptyCatalog ? (
                <p className="text-xs text-stone-400 italic">Filters appear once the catalog has products.</p>
              ) : (
                <FilterPanel
                  facets={facets}
                  catalog={catalog}
                  managedCategories={managedCategories}
                  params={panelParams}
                  setParam={setParam}
                  setParams={setParams}
                />
              )}
            </div>

            <div className="pt-4 border-t border-pink-100 flex gap-2 shrink-0">
              <button
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 bg-stone-100 text-stone-800 font-bold text-xs rounded-full cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#D92670] text-white font-bold text-xs rounded-full shadow-md cursor-pointer"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
