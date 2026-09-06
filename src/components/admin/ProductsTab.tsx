'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Grid,
  List,
  Edit,
  Trash2,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  AlertTriangle,
  PackageX,
  Warehouse,
  X,
} from 'lucide-react';
import { Product } from '@/data/products';
import { useCategories } from '@/lib/useCategories';
import { formatCurrency } from '@/lib/utils';

interface ProductsTabProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  /** Global search from the admin header — merged with the local search box. */
  searchQuery: string;
  /** Context catalog-feed length; a change refetches the page. */
  productsFeedCount: number;
  /** Bumped by the provider after any catalog write (save/delete/seed). */
  catalogVersion: number;
}

interface ProductsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ProductsCounts {
  categories: Record<string, number>;
  subCategories: Record<string, Record<string, number>>;
}

interface ProductsStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  totalUnits: number;
}

type SortKey = 'newest' | 'name' | 'price' | 'stock' | 'rating';
type SortDir = 'asc' | 'desc';
type StockFilter = 'all' | 'in' | 'low' | 'out';

const PAGE_SIZE_OPTIONS = [8, 16, 24];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=300&q=80';

// ─── Small building blocks ────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'stone',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'stone' | 'amber' | 'emerald' | 'rose';
}) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-[#9B050B] border-rose-200',
  } as const;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-2 hover:border-stone-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono font-bold text-xl sm:text-2xl text-stone-900 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-stone-500 font-medium truncate">{sub}</p>}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = activeKey === sortKey;
  return (
    <th className={`pb-3 pr-4 font-semibold whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer ${
          isActive ? 'text-stone-900' : ''
        }`}
        title={`Sort by ${label.toLowerCase()}`}
      >
        <span>{label}</span>
        {isActive ? (
          dir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#9B050B]" /> : <ArrowDown className="w-3 h-3 text-[#9B050B]" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

function pageWindow(current: number, total: number, span = 5): (number | '…')[] {
  if (total <= span + 2) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - Math.floor((span - 2) / 2));
  const end = Math.min(total - 1, start + span - 3);
  const middle: number[] = [];
  for (let p = start; p <= end; p++) middle.push(p);
  return [1, start > 2 ? '…' : null, ...middle, end < total - 1 ? '…' : null, total].filter(
    (p): p is number | '…' => p !== null
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function ProductsTab({
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onUpdateStock,
  searchQuery,
  productsFeedCount,
  catalogVersion,
}: ProductsTabProps) {
  // Server-side pagination state — every change below refetches /api/products.
  const [localQuery, setLocalQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // API response state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsPagination>({
    page: 1,
    pageSize: PAGE_SIZE_OPTIONS[0],
    totalItems: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<ProductsCounts | null>(null);
  const [stats, setStats] = useState<ProductsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Managed categories, merged with categories products actually carry — so a
  // product whose category was later renamed or deleted stays reachable.
  const { categories: managedCategories } = useCategories();

  // The header search takes precedence when active, like the previous merge logic.
  const effectiveQuery = searchQuery || localQuery;

  const buildParams = useCallback(
    () =>
      new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        category: selectedCategory,
        subCategory: selectedSubCategory,
        stock: stockFilter,
        query: debouncedQuery,
        sort: sortKey,
        dir: sortDir,
      }),
    [page, pageSize, selectedCategory, selectedSubCategory, stockFilter, debouncedQuery, sortKey, sortDir]
  );

  const fetchProducts = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?${buildParams()}`, { signal, cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);

        setProducts(data.products || []);
        setPagination(data.pagination);
        setCounts(data.counts);
        setStats(data.stats);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('[ProductsTab] fetch failed', err);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [buildParams]
  );

  // Fetch whenever any pagination/filter/sort param changes. An AbortController
  // cancels the stale request when params change again mid-flight.
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchProducts flips isLoading synchronously before its first await
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  // Debounce the merged search so we hit the API once typing settles, not per key.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(effectiveQuery), 300);
    return () => clearTimeout(t);
  }, [effectiveQuery]);

  // Live-ness: refetch when the context catalog feed changes length, or after
  // any catalog write (save/delete/seed — catalogVersion covers in-place edits).
  const lastFeedCountRef = useRef(productsFeedCount);
  const lastCatalogVersionRef = useRef(catalogVersion);
  useEffect(() => {
    const countChanged = lastFeedCountRef.current !== productsFeedCount;
    const versionChanged = lastCatalogVersionRef.current !== catalogVersion;
    if (!countChanged && !versionChanged) return;
    lastFeedCountRef.current = productsFeedCount;
    lastCatalogVersionRef.current = catalogVersion;
    fetchProducts();
  }, [productsFeedCount, catalogVersion, fetchProducts]);

  // Param setters that also reset to the first page.
  const applyLocalQuery = (value: string) => {
    setLocalQuery(value);
    setPage(1);
  };

  const applyCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory('All');
    setPage(1);
  };

  const applySubCategory = (sub: string) => {
    setSelectedSubCategory(sub);
    setPage(1);
  };

  const applyStockFilter = (stock: StockFilter) => {
    setStockFilter(stock);
    setPage(1);
  };

  const applyPageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  // Stock adjuster: optimistic local row update + context handler (API call,
  // global state, storefront refresh), then refetch for server truth.
  const handleStock = async (id: string, newStock: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)));
    await onUpdateStock(id, Math.max(0, newStock));
  };

  // Category pills: managed taxonomy first, then any category present in the
  // catalog counts (renamed/deleted taxonomy entries stay reachable).
  const categoryPills = React.useMemo(() => {
    const names = managedCategories.map((c) => c.name);
    const fromCounts = Object.keys(counts?.categories || {});
    return Array.from(new Set([...names, ...fromCounts]));
  }, [managedCategories, counts]);

  const subCategoryPills = React.useMemo(() => {
    if (selectedCategory === 'All') return [];
    const managed =
      managedCategories.find((c) => c.name === selectedCategory)?.subCategories.map((s) => s.name) ?? [];
    const fromCounts = Object.keys(counts?.subCategories?.[selectedCategory] || {});
    return Array.from(new Set([...managed, ...fromCounts]));
  }, [managedCategories, counts, selectedCategory]);

  const showSkeleton = isLoading && products.length === 0;
  const showEmpty = !isLoading && products.length === 0;

  // ─── Row renderers ─────────────────────────────────────────────────────────

  // Find the matched color/variation for the active search so the row can
  // preview exactly why this product matched (e.g. searching a hex code).
  const findMatchedVariation = (p: Product) => {
    if (!effectiveQuery.trim()) return null;
    const q = effectiveQuery.toLowerCase().trim();
    const cMatch = p.colors?.find(
      (c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q))
    );
    if (cMatch) {
      const photo =
        cMatch.images && cMatch.images.length > 0
          ? cMatch.images[0]
          : typeof cMatch.imageIndex === 'number'
            ? p.images?.[cMatch.imageIndex]
            : undefined;
      return { name: cMatch.name, hex: cMatch.hex, photo: photo ?? null };
    }
    const vMatch = p.variations?.find(
      (v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q))
    );
    if (vMatch) {
      return { name: vMatch.colorName, hex: vMatch.colorHex || '#000000', photo: vMatch.imageUrl || p.images?.[0] || null };
    }
    return null;
  };

  const tableRows = (p: Product) => {
    const stock = p.stock ?? 10;
    const isLow = stock > 0 && stock < 5;
    const isOut = stock === 0;
    const matched = findMatchedVariation(p);
    const displayImg = matched?.photo || p.images?.[0] || FALLBACK_IMAGE;

    return (
      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
        {/* Product */}
        <td className="py-3 pr-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-14 relative rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-xs">
              <Image src={displayImg} alt={p.name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 max-w-[220px]">
                <p className="font-bold text-stone-900 truncate">{p.name}</p>
                {p.freeDeliveryQuantity && p.freeDeliveryQuantity > 0 ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#A80C14]/10 text-[#A80C14] border border-[#A80C14]/20 shrink-0">
                    🚚 Free @ {p.freeDeliveryQuantity}+
                  </span>
                ) : null}
              </div>

              {matched && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                    style={{ backgroundColor: matched.hex || '#000' }}
                  />
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded font-mono">
                    Match: {matched.name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-mono text-stone-500">
                <span className="truncate max-w-[100px]">ID: {p.id}</span>
                <span>•</span>
                <span className="text-stone-700 font-semibold">{p.images?.length || 1} img</span>
                {p.variations && p.variations.length > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{p.variations.length} vars</span>
              </>
            )}
          </div>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="py-3 pr-4">
          <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-800 whitespace-nowrap">
            {p.category}
          </span>
          {p.subCategory && (
            <span className="block text-[10px] text-stone-400 mt-1 truncate max-w-[120px]">{p.subCategory}</span>
          )}
        </td>

        {/* Price & Buying Price */}
        <td className="py-3 pr-4 font-mono font-bold text-stone-900 whitespace-nowrap tabular-nums text-right">
          <div>{formatCurrency(p.price)}</div>
          {typeof p.buyingPrice === 'number' && p.buyingPrice > 0 ? (
            <div className="text-[10px] text-amber-700 font-medium">
              Cost: {formatCurrency(p.buyingPrice)}
              <span className="ml-1 font-bold text-emerald-700">
                (+{formatCurrency(p.price - p.buyingPrice)})
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-stone-400 font-normal italic">Cost: unset</div>
          )}
        </td>

        {/* Stock adjuster */}
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStock(p.id, stock - 1)}
              disabled={stock === 0}
              className="p-1 bg-stone-100 border border-stone-200 rounded hover:bg-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Decrease Stock"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                isOut
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : isLow
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {stock} pcs
            </span>
            <button
              onClick={() => handleStock(p.id, stock + 1)}
              className="p-1 bg-stone-100 border border-stone-200 rounded hover:bg-stone-200 text-stone-700 cursor-pointer"
              title="Increase Stock"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </td>

        {/* Fabric / work */}
        <td className="py-3 pr-4 text-stone-700 text-[11px]">
          <p className="font-semibold text-stone-900">{p.material || 'Nida Silk'}</p>
          <p className="text-[10px] text-stone-500">{p.workType || 'Embroidery'}</p>
        </td>

        {/* Rating */}
        <td className="py-3 pr-4 text-stone-700 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="font-bold text-stone-900">{p.rating || 5.0}</span>
          </div>
        </td>

        {/* Actions */}
        <td className="py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onOpenEditModal(p)}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Edit Product"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteProduct(p.id)}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Delete Product"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const gridCards = (p: Product) => {
    const stock = p.stock ?? 10;
    const isOut = stock === 0;
    const isLow = stock > 0 && stock < 5;

    return (
      <div
        key={p.id}
        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:border-stone-400 transition-all flex flex-col justify-between"
      >
        <div className="relative aspect-[3/4] bg-stone-100">
          <Image
            src={p.images?.[0] || FALLBACK_IMAGE}
            alt={p.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 border border-stone-200 rounded-full text-[10px] font-bold text-stone-900">
            {p.category}
          </div>
          <div
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isOut
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : isLow
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-stone-900 text-white border-stone-900'
            }`}
          >
            Stock: {stock}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="font-bold text-stone-900 text-sm line-clamp-1 flex items-center justify-between gap-1.5">
              <span className="truncate">{p.name}</span>
              {p.freeDeliveryQuantity && p.freeDeliveryQuantity > 0 ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#A80C14]/10 text-[#A80C14] border border-[#A80C14]/20 shrink-0 font-sans">
                  🚚 {p.freeDeliveryQuantity}+
                </span>
              ) : null}
            </h4>
            <p className="text-xs text-stone-500 mt-0.5 truncate">
              {p.material} • {p.workType}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="font-mono text-base font-black text-stone-900">{formatCurrency(p.price)}</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenEditModal(p)}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteProduct(p.id)}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* KPI strip (server-aggregated) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={stats?.total ?? '—'} sub={`${stats?.totalUnits ?? 0} units in stock`} />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats?.lowStock ?? '—'}
          sub="1–4 units left"
          tone="amber"
        />
        <StatCard icon={PackageX} label="Out of Stock" value={stats?.outOfStock ?? '—'} sub="needs restocking" tone="rose" />
        <StatCard
          icon={Warehouse}
          label="Inventory Value"
          value={stats ? formatCurrency(stats.inventoryValue) : '—'}
          sub="price × stock"
          tone="emerald"
        />
      </div>

      {/* Filter & search controls */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Category pills (server-counted) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-xs font-bold scrollbar-none">
            {['All', ...categoryPills].map((cat) => {
              const count = cat === 'All' ? stats?.total ?? 0 : counts?.categories?.[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => applyCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white shadow-sm font-bold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* View switch + add product */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center p-1 bg-stone-100 border border-stone-200 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Subcategory pills — only meaningful once a category is picked */}
        {subCategoryPills.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-stone-200 text-[11px] font-bold scrollbar-none">
            <span className="text-stone-500 font-medium whitespace-nowrap pr-1">Subcategory:</span>
            {['All', ...subCategoryPills].map((sub) => {
              const count =
                sub === 'All'
                  ? counts?.categories?.[selectedCategory] ?? 0
                  : counts?.subCategories?.[selectedCategory]?.[sub] ?? 0;
              return (
                <button
                  key={sub}
                  onClick={() => applySubCategory(sub)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedSubCategory === sub
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span>{sub}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search + stock filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => applyLocalQuery(e.target.value)}
              placeholder="Search title, work type, material, color…"
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => applyLocalQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-stone-600 font-medium">Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => applyStockFilter(e.target.value as StockFilter)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 font-bold cursor-pointer"
            >
              <option value="all">All Items</option>
              <option value="in">In Stock (≥5)</option>
              <option value="low">Low Stock (1–4)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory view */}
      {showSkeleton ? (
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3 animate-pulse">
          {[...Array(pageSize)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-12 h-14 bg-stone-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-stone-200 rounded w-2/5" />
                <div className="h-2 bg-stone-100 rounded w-1/4" />
              </div>
              <div className="h-3 bg-stone-100 rounded w-16" />
              <div className="h-6 bg-stone-100 rounded-lg w-20" />
              <div className="h-6 bg-stone-100 rounded-lg w-16" />
            </div>
          ))}
        </div>
      ) : showEmpty ? (
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Package className="w-6 h-6 text-stone-400" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-stone-900">No products found</p>
              <p className="text-xs text-stone-500">
                {effectiveQuery.trim() || selectedCategory !== 'All' || stockFilter !== 'all'
                  ? 'Nothing matches the current search and filters.'
                  : 'Your catalog is empty — add your first product to get started.'}
              </p>
            </div>
            {effectiveQuery.trim() || selectedCategory !== 'All' || stockFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  applyLocalQuery('');
                  applyCategory('All');
                  applyStockFilter('all');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-[#9B050B] hover:bg-[#B8000A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Product
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
          {/* Result count + rows-per-page */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs font-mono text-stone-500">
              Showing{' '}
              <strong className="text-stone-900">
                {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
              </strong>{' '}
              of {pagination.totalItems} product{pagination.totalItems !== 1 ? 's' : ''}
              {(selectedCategory !== 'All' || stockFilter !== 'all' || effectiveQuery.trim()) && stats && (
                <span className="text-stone-400"> (filtered from {stats.total})</span>
              )}
            </span>

            <label className="flex items-center gap-2 text-[10px] font-mono text-stone-500 uppercase tracking-wide">
              Rows
              <select
                value={pageSize}
                onChange={(e) => applyPageSize(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
                title="Rows per page"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={`overflow-x-auto transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                  <SortableHeader label="Product" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <SortableHeader label="Price (৳)" sortKey="price" activeKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                  <SortableHeader label="Stock" sortKey="stock" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="pb-3 pr-4 font-semibold">Fabric / Work</th>
                  <SortableHeader label="Rating" sortKey="rating" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {products.map(tableRows)}
              </tbody>
            </table>
          </div>

          {/* Server-side pagination — always rendered; buttons disable at edges. */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <span className="text-[10px] font-mono text-stone-400">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} total
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-0.5"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              {pagination.totalPages > 1 &&
                pageWindow(pagination.page, pagination.totalPages).map((p, idx) =>
                  p === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-stone-400 text-xs font-mono">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                        p === pagination.page
                          ? 'bg-stone-900 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                      aria-current={p === pagination.page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-0.5"
                title="Next page"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid view with its own pagination footer */
        <div className="space-y-4">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            {products.map(gridCards)}
          </div>

          <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-stone-400">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} total
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-2 text-xs font-mono font-bold text-stone-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
