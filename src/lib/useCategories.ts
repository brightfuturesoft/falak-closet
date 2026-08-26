'use client';

/**
 * useCategories — single client-side source of truth for the category taxonomy.
 *
 * Replaces the old localStorage store (`getStoredCategories`/`saveStoredCategories`):
 * every consumer now reads from `/api/categories` (MongoDB via Prisma).
 *
 * Mutating components call `notifyCategoriesUpdated()` after a successful write so
 * that every other mounted consumer (mobile drawer, shop filters, product form)
 * refetches without a page reload.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@/data/categories';
import { apiFetch, type CategoriesResponse } from '@/lib/fetcher';

const CATEGORIES_UPDATED_EVENT = 'falak:categories-updated';

/** Broadcast to all mounted `useCategories()` consumers that the taxonomy changed. */
export function notifyCategoriesUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
}

interface UseCategoriesOptions {
  /** Shown while loading and if the request fails. Storefront passes INITIAL_CATEGORIES; admin passes nothing. */
  fallback?: Category[];
}

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesResult {
  const { fallback } = options;

  // Captured once: a consumer's fallback is a constant, and snapshotting it here keeps
  // `reload` stable even when the caller passes an inline array literal.
  const [fallbackSnapshot] = useState(() => fallback);

  const [categories, setCategories] = useState<Category[]>(fallbackSnapshot ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Apply a fetch result to state. Pure state-setting — no I/O. */
  const commit = useCallback(
    (res: Awaited<ReturnType<typeof apiFetch<CategoriesResponse>>>) => {
      if (res.success && Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
        setError(null);
      } else {
        setError(res.success ? 'Malformed categories response' : res.error);
        if (fallbackSnapshot) setCategories(fallbackSnapshot);
      }
      setIsLoading(false);
    },
    [fallbackSnapshot]
  );

  /** Admin edits must never read a stale cache, hence no-store. */
  const requestCategories = () =>
    apiFetch<CategoriesResponse>('/api/categories', { cache: 'no-store' });

  /** Manual refetch for event handlers — shows the spinner again while it runs. */
  const reload = useCallback(async () => {
    setIsLoading(true);
    commit(await requestCategories());
  }, [commit]);

  useEffect(() => {
    // `isLoading` starts true, so the initial fetch commits from the callback only.
    let cancelled = false;
    requestCategories().then((res) => {
      if (!cancelled) commit(res);
    });

    const onUpdated = () => void reload();
    window.addEventListener(CATEGORIES_UPDATED_EVENT, onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, onUpdated);
    };
  }, [commit, reload]);

  return { categories, isLoading, error, reload };
}
