'use client';

/**
 * tableKit — shared building blocks for the server-paginated admin tables
 * (security, promotions, banners, reviews). Keeps every admin view visually
 * and behaviourally identical to the orders/products/customers tables.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type SortDir = 'asc' | 'desc';

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Debounce a fast-changing value (search boxes) before it hits the API. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Fetch a server-paginated admin endpoint. `url` changes refetch; stale
 * in-flight requests are aborted. `onError` receives non-abort failures.
 */
export function usePaginatedRows<T>(
  url: string,
  select: (data: Record<string, unknown>) => { rows: T[]; pagination: TablePagination },
  onError?: (message: string) => void
) {
  const [rows, setRows] = useState<T[]>([]);
  const [pagination, setPagination] = useState<TablePagination>({
    page: 1,
    pageSize: 8,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
        const picked = select(data);
        setRows(picked.rows || []);
        setPagination(picked.pagination);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        onError?.((err as Error).message || 'Request failed');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- select/onError are stable per-tab closures
  }, [url, nonce]);

  return { rows, setRows, pagination, setPagination, isLoading, refetch };
}

// ─── Components ───────────────────────────────────────────────────────────────

export function StatCard({
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

export function SortHeader({
  label,
  active,
  dir,
  onSort,
  align = 'left',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <th className={`pb-3 pr-4 font-semibold whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer ${
          active ? 'text-stone-900' : ''
        }`}
        title={`Sort by ${label.toLowerCase()}`}
      >
        <span>{label}</span>
        {active ? (
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
export function pageWindow(current: number, total: number, span = 5): (number | '…')[] {
  if (total <= span + 2) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - Math.floor((span - 2) / 2));
  const end = Math.min(total - 1, start + span - 3);
  const middle: number[] = [];
  for (let p = start; p <= end; p++) middle.push(p);
  return [1, start > 2 ? '…' : null, ...middle, end < total - 1 ? '…' : null, total].filter(
    (p): p is number | '…' => p !== null
  );
}

/** Rows-per-page select + always-visible pager. Standard across all admin tables. */
export function PaginationBar({
  pagination,
  onPage,
  onPageSize,
  pageSizeOptions = [8, 16, 24],
}: {
  pagination: TablePagination;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
      <span className="text-[10px] font-mono text-stone-400">
        Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} total
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[10px] font-mono text-stone-500 uppercase tracking-wide">
          Rows
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
            title="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(pagination.page - 1)}
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
                  onClick={() => onPage(p)}
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
            onClick={() => onPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Next page"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
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
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  onClear,
  clearLabel = 'Clear filters',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="py-16 text-center space-y-3">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
        <Icon className="w-6 h-6 text-stone-400" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-sm text-stone-900">{title}</p>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">{description}</p>
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" /> {clearLabel}
        </button>
      )}
    </div>
  );
}

/** "Showing X–Y of Z" counter used above every table. */
export function ResultCount({ pagination, filteredFrom }: { pagination: TablePagination; filteredFrom?: number }) {
  const from = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
  return (
    <span className="text-xs font-mono text-stone-500">
      Showing <strong className="text-stone-900">{from}–{to}</strong> of {pagination.totalItems}
      {filteredFrom !== undefined && filteredFrom !== pagination.totalItems && (
        <span className="text-stone-400"> (filtered from {filteredFrom})</span>
      )}
    </span>
  );
}
