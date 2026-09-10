'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users, MapPin, Search, MessageSquare, ShieldCheck, Ban, Globe,
  ShieldAlert, ShoppingCart, X, Package, Tag, Palette, Ruler,
  Hash, DollarSign, ShoppingBag, Download, Copy, Check, Crown,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, UserX, Loader2,
} from 'lucide-react';
import { OrderRecord } from '@/context/CartContext';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

interface CustomersTabProps {
  orders: OrderRecord[];
  products: Product[];
}

interface DbCartItem {
  productId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

/** One row as returned by GET /api/customers (server-aggregated + paginated). */
interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  ip: string;
  totalOrders: number;
  totalSpent: number;
  isBlocked: boolean;
  registeredAt: string | null;
  cart: DbCartItem[];
}

interface CustomersPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface CustomersCounts {
  all: number;
  vip: number;
  active: number;
  blocked: number;
  cart: number;
}

interface CustomersStats {
  totalCustomers: number;
  vipCount: number;
  blockedCount: number;
  lifetimeRevenue: number;
  openCartsCount: number;
  openCartValue: number;
  registeredCount: number;
  guestCount: number;
  maxSpend: number;
}

interface ResolvedCartItem {
  product: Product | null;
  productId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

type CustomerTier = 'blocked' | 'vip' | 'active';

const customerTier = (c: ApiCustomer): CustomerTier => {
  if (c.isBlocked) return 'blocked';
  if (c.totalSpent > 10000 || c.totalOrders >= 2) return 'vip';
  return 'active';
};

const FALLBACK_IP = '103.24.12.89';
const PAGE_SIZE_OPTIONS = [8, 16, 24];

// ─── Small building blocks ────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-rose-500 to-red-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
];

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function CustomerAvatar({ name, blocked }: { name: string; blocked?: boolean }) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-[11px] font-bold text-white shadow-xs flex-shrink-0 ${blocked ? 'bg-stone-400 dark:bg-stone-600' : `bg-gradient-to-br ${avatarGradient(name)}`
        }`}
      aria-hidden
    >
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

function TierBadge({ tier }: { tier: CustomerTier }) {
  if (tier === 'blocked') {
    return (
      <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
        <ShieldAlert className="w-3 h-3 text-red-600" /> IP Blocked
      </span>
    );
  }
  if (tier === 'vip') {
    return (
      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
        <Crown className="w-3 h-3 text-amber-700" /> VIP Patron
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active
    </span>
  );
}

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
    <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-2 group hover:border-stone-300 transition-colors">
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

type SortKey = 'name' | 'orders' | 'spent';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'vip' | 'active' | 'blocked' | 'cart';

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
        className={`inline-flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer ${isActive ? 'text-stone-900' : ''
          }`}
        title={`Sort by ${label.toLowerCase()}`}
      >
        <span>{label}</span>
        {isActive ? (
          dir === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-[#9B050B]" />
          ) : (
            <ArrowDown className="w-3 h-3 text-[#9B050B]" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

/** Centered window of page numbers, e.g. 1 … 4 5 6 … 12 */
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

// ─── Cart Detail Modal ────────────────────────────────────────────────────────

function CartDetailModal({
  customer,
  products,
  onClose,
}: {
  customer: ApiCustomer;
  products: Product[];
  onClose: () => void;
}) {
  const resolved: ResolvedCartItem[] = customer.cart.map((item) => {
    const product = products.find((p) => p.id === item.productId) ?? null;
    const unitPrice = product?.price ?? 0;
    return {
      product,
      productId: item.productId,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const grandTotal = resolved.reduce((s, i) => s + i.lineTotal, 0);
  const totalItems = resolved.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(customer.name)} flex items-center justify-center text-white font-bold text-sm shadow`}>
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                {customer.name}&apos;s Saved Cart
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <ShoppingCart className="w-3 h-3" />
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {resolved.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Cart is empty</p>
            </div>
          ) : (
            resolved.map((item, idx) => {
              const colorObj = item.product?.colors?.find(
                (c) => c.name.toLowerCase() === item.selectedColor.toLowerCase()
              );
              const imageSrc =
                colorObj?.images?.[0] ||
                item.product?.images?.[0] ||
                '';

              return (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}-${idx}`}
                  className="flex items-start gap-4 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/50"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-700 flex-shrink-0">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt={item.product?.name ?? item.productId}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-stone-900 dark:text-stone-100 leading-tight truncate">
                      {item.product?.name ?? (
                        <span className="text-stone-400 font-mono text-[11px]">{item.productId}</span>
                      )}
                    </p>
                    {item.product?.code && (
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" />
                        {item.product.code}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Palette className="w-2.5 h-2.5" />
                        {item.selectedColor}
                        {colorObj?.hex && (
                          <span
                            className="w-3 h-3 rounded-full border border-stone-300 inline-block"
                            style={{ backgroundColor: colorObj.hex }}
                          />
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Ruler className="w-2.5 h-2.5" />
                        {item.selectedSize}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 px-2 py-0.5 rounded-full">
                        <Hash className="w-2.5 h-2.5" />
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-400">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Grand Total */}
        {resolved.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">Cart Total</span>
                <span className="text-xs text-stone-400">({totalItems} items)</span>
              </div>
              <p className="font-bold text-lg text-stone-900 dark:text-stone-100">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function CustomersTab({ orders, products }: CustomersTabProps) {
  const { addToast } = useAdminDashboard();


  // The provider recreates `addToast` on every render (toasts, socket state,
  // 30s order syncs). A ref keeps it out of `fetchCustomers`'s dependencies so
  // those re-renders never trigger a spurious customers refetch.
  const addToastRef = useRef(addToast);
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  const searchParams = useSearchParams();
  const urlQuery = searchParams ? searchParams.get('query') || '' : '';

  // Server-side pagination state — every change below refetches /api/customers.
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Sync search state if URL query parameter is provided or updated
  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setDebouncedQuery(urlQuery);
      setPage(1);
    }
  }, [urlQuery]);

  // API response state
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [pagination, setPagination] = useState<CustomersPagination>({
    page: 1,
    pageSize: PAGE_SIZE_OPTIONS[0],
    totalItems: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<CustomersCounts>({ all: 0, vip: 0, active: 0, blocked: 0, cart: 0 });
  const [stats, setStats] = useState<CustomersStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [cartModalCustomer, setCartModalCustomer] = useState<ApiCustomer | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const buildParams = useCallback(
    (overrides?: { pageSize?: number }) =>
      new URLSearchParams({
        page: String(page),
        pageSize: String(overrides?.pageSize ?? pageSize),
        query: debouncedQuery,
        filter: statusFilter,
        sort: sortKey,
        dir: sortDir,
      }),
    [page, pageSize, debouncedQuery, statusFilter, sortKey, sortDir]
  );

  const fetchCustomers = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/customers?${buildParams()}`, {
          signal,
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        setCustomers(data.customers || []);
        setPagination(data.pagination);
        setCounts(data.counts);
        setStats(data.stats);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        addToastRef.current('error', `Could not load customers: ${(err as Error).message}`);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchCustomers flips isLoading synchronously before its first await
    fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [fetchCustomers]);

  // Debounce the search box so we hit the API once typing settles, not per key.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Live-ness: when the layout's order feed changes (socket alert or its 30s
  // sync), refetch the current page so new buyers appear without a manual reload.
  const ordersCount = orders.length;
  const lastOrdersCountRef = useRef(ordersCount);
  useEffect(() => {
    if (lastOrdersCountRef.current === ordersCount) return;
    lastOrdersCountRef.current = ordersCount;
    fetchCustomers();
  }, [ordersCount, fetchCustomers]);

  // Param setters that also reset to the first page — the server would clamp
  // anyway, but starting from page 1 is what the user expects after filtering.
  const applyQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const applyStatusFilter = (filter: StatusFilter) => {
    setStatusFilter(filter);
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

  const applyPageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const copyPhone = async (phone: string) => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 1500);
    } catch {
      addToast('error', 'Could not copy phone number to clipboard.');
    }
  };

  // Optimistic block/unblock: flip the row immediately, hit the security API,
  // then refetch so counts/stats stay truthful. Reverts on failure.
  const handleToggleBlockIp = async (customer: ApiCustomer) => {
    const targetIp = customer.ip || FALLBACK_IP;
    const wasBlocked = customer.isBlocked;

    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, isBlocked: !wasBlocked } : c))
    );

    try {
      const res = wasBlocked
        ? await fetch(`/api/security/block-ip?ip=${encodeURIComponent(targetIp)}`, { method: 'DELETE' })
        : await fetch('/api/security/block-ip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: targetIp,
            reason: `Blocked for customer ${customer.name}`,
            blockedBy: 'Admin',
          }),
        });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error || `HTTP ${res.status}`);

      addToast(wasBlocked ? 'success' : 'warning', `${wasBlocked ? 'Unblocked' : 'Blocked'} IP ${targetIp} for ${customer.name}.`);
      fetchCustomers();
    } catch (err) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isBlocked: wasBlocked } : c))
      );
      addToast('error', `Could not update block for ${customer.name}: ${(err as Error).message}`);
    }
  };

  // CSV export re-queries the API with the same search/filter/sort but a large
  // page size, so the export always matches what the table is showing.
  const exportToCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/customers?${buildParams({ pageSize: 500 })}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);

      const rows: string[][] = (data.customers as ApiCustomer[]).map((c) => {
        const cartCount = c.cart.reduce((s, i) => s + i.quantity, 0);
        const cartValue = c.cart.reduce((s, i) => {
          const product = products.find((p) => p.id === i.productId);
          return s + (product?.price ?? 0) * i.quantity;
        }, 0);
        const tierLabel = customerTier(c) === 'blocked' ? 'Blocked' : customerTier(c) === 'vip' ? 'VIP' : 'Active';
        return [
          `"${c.name}"`,
          `"${c.email}"`,
          c.phone,
          `"${c.district}"`,
          c.ip,
          String(c.totalOrders),
          String(c.totalSpent),
          tierLabel,
          String(cartCount),
          String(cartValue),
          `"${c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : '—'}"`,
        ];
      });

      if (rows.length === 0) {
        addToast('info', 'No customers to export with the current filters.');
        return;
      }

      const headers = ['Name', 'Email', 'Phone', 'District', 'IP', 'Total Orders', 'Lifetime Spent (BDT)', 'Tier', 'Cart Items', 'Cart Value (BDT)', 'Registered'];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Falak_Closet_Customers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', `Exported ${rows.length} customer records to CSV.`);
    } catch (err) {
      addToast('error', `Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const filterPills: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Customers', count: counts.all },
    { id: 'vip', label: 'VIP Patrons', count: counts.vip },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'blocked', label: 'Blocked', count: counts.blocked },
    { id: 'cart', label: 'Open Carts', count: counts.cart },
  ];

  const maxSpent = stats?.maxSpend ?? 0;
  const showSkeleton = isLoading && customers.length === 0;
  const showEmpty = !isLoading && customers.length === 0;

  const tableRows = (c: ApiCustomer) => {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/88${cleanPhone}`;
    const tier = customerTier(c);
    const cartCount = c.cart.reduce((s, i) => s + i.quantity, 0);
    const cartValue = c.cart.reduce((s, i) => {
      const product = products.find((p) => p.id === i.productId);
      return s + (product?.price ?? 0) * i.quantity;
    }, 0);
    const spendRatio = maxSpent > 0 ? Math.min(100, Math.round((c.totalSpent / maxSpent) * 100)) : 0;
    const hasPhone = cleanPhone.length >= 10;

    return (
      <tr
        key={c.id}
        className={`transition-colors ${tier === 'blocked' ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-stone-50'}`}
      >
        {/* Customer */}
        <td className="py-3.5 pr-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <CustomerAvatar name={c.name} blocked={tier === 'blocked'} />
            <div className="min-w-0">
              <span className="block font-bold text-stone-900 truncate max-w-[160px]">{c.name}</span>
              <span className="text-[10px] text-stone-400 font-mono font-normal truncate max-w-[160px] block">
                {c.email}
              </span>
            </div>
          </div>
        </td>

        {/* Phone with copy */}
        <td className="py-3.5 pr-4">
          <button
            type="button"
            onClick={() => copyPhone(c.phone)}
            className="group inline-flex items-center gap-1.5 font-mono font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
            title="Click to copy phone number"
          >
            {c.phone || '—'}
            {c.phone && (
              copiedPhone === c.phone ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-stone-300 group-hover:text-stone-600 transition-colors" />
              )
            )}
          </button>
        </td>

        {/* Location + IP */}
        <td className="py-3.5 pr-4">
          <div className="space-y-0.5">
            <span className="flex items-center gap-1 font-semibold text-stone-900 text-[11px]">
              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
              {c.district}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
              <Globe className="w-3 h-3 flex-shrink-0" /> {c.ip}
            </span>
          </div>
        </td>

        {/* Orders */}
        <td className="py-3.5 pr-4 text-right">
          <span className="font-mono font-bold text-stone-900 tabular-nums">{c.totalOrders}</span>
          <span className="block text-[9px] text-stone-400 uppercase tracking-wide">
            {c.totalOrders === 0 ? 'no orders' : c.totalOrders === 1 ? 'order' : 'orders'}
          </span>
        </td>

        {/* Lifetime value with share bar */}
        <td className="py-3.5 pr-4">
          <div className="flex flex-col items-end gap-1 min-w-[110px]">
            <span className="font-mono font-bold text-[#9B050B] tabular-nums">
              {formatCurrency(c.totalSpent)}
            </span>
            <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${tier === 'vip' ? 'bg-amber-500' : 'bg-stone-400'}`}
                style={{ width: `${spendRatio}%` }}
                title={`${spendRatio}% of top customer spend`}
              />
            </div>
          </div>
        </td>

        {/* Saved cart */}
        <td className="py-3.5 pr-4">
          {cartCount > 0 ? (
            <button
              type="button"
              onClick={() => setCartModalCustomer(c)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-800 transition-colors cursor-pointer group whitespace-nowrap"
              title={`View saved cart — ${formatCurrency(cartValue)}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="tabular-nums">{cartCount}</span>
              <span className="text-amber-600 font-mono">· {formatCurrency(cartValue)}</span>
            </button>
          ) : (
            <span className="text-stone-300 text-xs" title="No saved cart">—</span>
          )}
        </td>

        {/* Tier */}
        <td className="py-3.5 pr-4">
          <TierBadge tier={tier} />
        </td>

        {/* Actions */}
        <td className="py-3.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {hasPhone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-colors cursor-pointer"
                title={`WhatsApp ${c.name} on ${c.phone}`}
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => handleToggleBlockIp(c)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${c.isBlocked
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-red-50 hover:bg-[#9B050B] text-[#9B050B] hover:text-white border-red-200 hover:border-[#9B050B]'
                }`}
              title={c.isBlocked ? `Unblock IP ${c.ip}` : `Block IP ${c.ip} for ${c.name}`}
            >
              {c.isBlocked ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const mobileCards = (c: ApiCustomer) => {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/88${cleanPhone}`;
    const tier = customerTier(c);
    const cartCount = c.cart.reduce((s, i) => s + i.quantity, 0);
    const cartValue = c.cart.reduce((s, i) => {
      const product = products.find((p) => p.id === i.productId);
      return s + (product?.price ?? 0) * i.quantity;
    }, 0);
    const hasPhone = cleanPhone.length >= 10;

    return (
      <div
        key={c.id}
        className={`p-4 rounded-2xl border space-y-3 ${tier === 'blocked' ? 'bg-red-50/40 border-red-200' : 'bg-stone-50 border-stone-200'
          }`}
      >
        {/* Header: avatar, name, tier */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CustomerAvatar name={c.name} blocked={tier === 'blocked'} />
            <div className="min-w-0">
              <p className="font-bold text-stone-900 truncate">{c.name}</p>
              <button
                type="button"
                onClick={() => copyPhone(c.phone)}
                className="text-[10px] text-stone-500 font-mono flex items-center gap-1 cursor-pointer"
              >
                {c.phone || '—'}
                {c.phone && (
                  copiedPhone === c.phone ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-stone-300" />
                  )
                )}
              </button>
            </div>
          </div>
          <TierBadge tier={tier} />
        </div>

        {/* Meta: location + IP */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1 font-semibold text-stone-700">
            <MapPin className="w-3 h-3 text-rose-500" /> {c.district}
          </span>
          <span className="flex items-center gap-1 font-mono text-stone-400">
            <Globe className="w-3 h-3" /> {c.ip}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white border border-stone-200 rounded-xl py-2">
            <p className="font-mono font-bold text-stone-900 tabular-nums">{c.totalOrders}</p>
            <p className="text-[9px] text-stone-400 uppercase tracking-wide">Orders</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl py-2">
            <p className="font-mono font-bold text-[#9B050B] tabular-nums text-xs">{formatCurrency(c.totalSpent)}</p>
            <p className="text-[9px] text-stone-400 uppercase tracking-wide">Spent</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl py-2">
            {cartCount > 0 ? (
              <button
                type="button"
                onClick={() => setCartModalCustomer(c)}
                className="font-mono font-bold text-amber-700 tabular-nums cursor-pointer"
                title={`View saved cart — ${formatCurrency(cartValue)}`}
              >
                {formatCurrency(cartValue)}
              </button>
            ) : (
              <p className="font-mono font-bold text-stone-300">—</p>
            )}
            <p className="text-[9px] text-stone-400 uppercase tracking-wide">
              {cartCount > 0 ? `${cartCount} in cart` : 'Cart'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasPhone && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-bold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => handleToggleBlockIp(c)}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer ${c.isBlocked
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-red-50 hover:bg-[#9B050B] text-[#9B050B] hover:text-white border-red-200'
              }`}
          >
            {c.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
            {c.isBlocked ? 'Unblock IP' : 'Block IP'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* Cart Detail Modal */}
      {cartModalCustomer && (
        <CartDetailModal
          customer={cartModalCustomer}
          products={products}
          onClose={() => setCartModalCustomer(null)}
        />
      )}

      {/* KPI Summary Cards (server-aggregated over ALL customers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.totalCustomers ?? '—'}
          sub={stats ? `${stats.registeredCount} registered · ${stats.guestCount} guest` : 'loading…'}
        />
        <StatCard
          icon={Crown}
          label="VIP Patrons"
          value={stats?.vipCount ?? '—'}
          sub="৳10k+ spent or 2+ orders"
          tone="amber"
        />
        <StatCard
          icon={DollarSign}
          label="Lifetime Revenue"
          value={stats ? formatCurrency(stats.lifetimeRevenue) : '—'}
          sub="across all customers"
          tone="emerald"
        />
        <StatCard
          icon={ShoppingCart}
          label="Open Carts"
          value={stats?.openCartsCount ?? '—'}
          sub={stats && stats.openCartValue > 0 ? `${formatCurrency(stats.openCartValue)} recoverable` : 'no active carts'}
          tone="rose"
        />
      </div>

      {/* Filter & Search Controls */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status Filter Pills (server-counted within the current search) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto text-xs font-bold scrollbar-none">
            {filterPills.map((f) => (
              <button
                key={f.id}
                onClick={() => applyStatusFilter(f.id)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === f.id
                  ? 'bg-stone-900 text-white shadow-sm font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] font-mono opacity-80">({f.count})</span>
              </button>
            ))}
          </div>

          {/* Search + Export */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => applyQuery(e.target.value)}
                placeholder="Search name, phone, IP, district..."
                className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => applyQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={exportToCSV}
              disabled={isExporting || pagination.totalItems === 0}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 text-[#F2C76E] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#F2C76E]" />
              )}
              <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
        {/* Result count + rows-per-page */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-mono text-stone-500">
            Showing{' '}
            <strong className="text-stone-900">
              {pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
            </strong>{' '}
            of {pagination.totalItems} customer{pagination.totalItems !== 1 ? 's' : ''}
            {statusFilter !== 'all' && stats && (
              <span className="text-stone-400"> (filtered from {stats.totalCustomers})</span>
            )}
          </span>

          <div className="flex items-center gap-3">
            {stats && stats.blockedCount > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                <UserX className="w-3 h-3" /> {stats.blockedCount} blocked IP{stats.blockedCount !== 1 ? 's' : ''}
              </span>
            )}
            {/* Rows per page — server-side page size */}
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
        </div>

        {/* Loading skeleton (first load) */}
        {showSkeleton ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 rounded-full bg-stone-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-2 bg-stone-100 rounded w-1/4" />
                </div>
                <div className="h-3 bg-stone-100 rounded w-16" />
                <div className="h-3 bg-stone-100 rounded w-20" />
                <div className="h-6 bg-stone-100 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          /* Empty state */
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Users className="w-6 h-6 text-stone-400" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-stone-900">No customers found</p>
              <p className="text-xs text-stone-500">
                {query.trim()
                  ? `No records match "${query.trim()}"${statusFilter !== 'all' ? ' with the selected filter' : ''}.`
                  : 'Customer records will appear here once users register or place orders.'}
              </p>
            </div>
            {(query.trim() || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  applyQuery('');
                  applyStatusFilter('all');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table — dimmed during background refetches */}
            <div className={`hidden lg:block overflow-x-auto transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px]">
                    <SortableHeader label="Customer" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="pb-3 pr-4 font-semibold">Phone</th>
                    <th className="pb-3 pr-4 font-semibold">Location &amp; IP</th>
                    <SortableHeader label="Orders" sortKey="orders" activeKey={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <th className="pb-3 pr-4 font-semibold text-right">Lifetime Value</th>
                    <th className="pb-3 pr-4 font-semibold">Saved Cart</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {customers.map(tableRows)}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={`lg:hidden space-y-3 transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              {customers.map(mobileCards)}
            </div>

            {/* Server-side pagination — always rendered (standard data-grid
                pattern) so totals and controls stay discoverable even on a
                single-page result set; buttons just disable at the edges. */}
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
                        className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${p === pagination.page
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
          </>
        )}
      </div>
    </div>
  );
}
