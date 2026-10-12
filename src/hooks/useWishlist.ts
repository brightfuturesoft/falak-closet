'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product } from '@/data/products';
import { useToast } from '@/components/ui/Toast';

export function useWishlist(products: Product[], user?: { id?: string } | null) {
  const { showToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Load initial wishlist from localStorage (guest fallback) on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('falak_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Support both legacy format (Product[]) and new format (string[] or Product[])
          const ids = parsed
            .map((item: unknown) => {
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object' && 'id' in item) {
                return (item as { id: string }).id;
              }
              return '';
            })
            .filter((id): id is string => !!id);
          setWishlistIds(ids);
        }
      }
    } catch (err) {
      console.error('Failed to load local wishlist:', err);
    } finally {
      isInitializedRef.current = true;
      setIsLoading(false);
    }
  }, []);

  // Sync wishlistIds to localStorage — NEVER run before initial load finishes
  useEffect(() => {
    if (!isInitializedRef.current) return;

    try {
      const existingRaw = localStorage.getItem('falak_wishlist');
      const cachedMap = new Map<string, any>();
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item === 'object' && 'id' in item) {
                cachedMap.set(item.id, item);
              }
            }
          }
        } catch {}
      }

      // Preserve full product objects for offline/guest rendering
      const resolved = wishlistIds.map((id) => {
        const found = products.find((p) => p.id === id);
        if (found) return found;
        if (cachedMap.has(id)) return cachedMap.get(id);
        return { id };
      });

      localStorage.setItem('falak_wishlist', JSON.stringify(resolved));
    } catch (err) {
      console.error('Failed to sync wishlist to localStorage:', err);
    }
  }, [wishlistIds, products]);

  // Resolve product IDs to full Product objects (using products catalog or cached objects)
  const wishlist = useMemo(() => {
    let cachedMap = new Map<string, any>();
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('falak_wishlist');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item === 'object' && 'id' in item) {
                cachedMap.set(item.id, item);
              }
            }
          }
        }
      } catch {}
    }

    return wishlistIds
      .map((id) => products.find((p) => p.id === id) || cachedMap.get(id))
      .filter((p): p is Product => !!p && typeof p === 'object' && 'name' in p);
  }, [wishlistIds, products]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    try {
      localStorage.removeItem('falak_wishlist');
    } catch {}
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    // Adding to wishlist requires user to be signed in
    if (!user) {
      showToast({
        type: 'wishlist',
        title: 'Sign In Required',
        subtitle: 'Please sign in to save items to your wishlist.',
        actionLink: '/account?type=login',
        actionText: 'Sign In',
      });
      return;
    }

    const targetId = product.id;
    const exists = wishlistIds.includes(targetId);
    const willAdd = !exists;

    const nextIds = exists ? wishlistIds.filter((id) => id !== targetId) : [...wishlistIds, targetId];
    setWishlistIds(nextIds);

    // Immediately and synchronously update localStorage so quick reload never loses items
    try {
      const existingRaw = localStorage.getItem('falak_wishlist');
      let currentList: any[] = [];
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) currentList = parsed;
        } catch {}
      }

      let updatedList: any[];
      if (exists) {
        updatedList = currentList.filter((item) => {
          const id = typeof item === 'string' ? item : item?.id;
          return id !== targetId;
        });
      } else {
        const already = currentList.some((item) => {
          const id = typeof item === 'string' ? item : item?.id;
          return id === targetId;
        });
        updatedList = already ? currentList : [...currentList, product];
      }
      localStorage.setItem('falak_wishlist', JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to write directly to localStorage:', err);
    }

    // Push update to MongoDB database via /api/user/me/wishlist
    try {
      const res = await fetch('/api/user/me/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishlist)) {
          setWishlistIds(data.wishlist);
        }
      }
    } catch {
      // Silently ignore network failures (fallback to local state)
    }

    showToast({
      type: 'wishlist',
      title: willAdd ? 'Saved to Wishlist' : 'Removed from Wishlist',
      subtitle: willAdd ? `${product.name} saved to your account database.` : product.name,
      image: product.images?.[0],
      price: product.price,
      actionLink: '/account',
      actionText: 'View Wishlist',
    });
  }, [wishlistIds, user, showToast]);

  const mergeServerWishlist = useCallback((serverIds: string[]) => {
    // Overwrite/merge the wishlist on the client
    setWishlistIds((prev) => {
      const merged = Array.from(new Set([...prev, ...serverIds]));

      // Also push the merged list back to server to synchronize if logged in
      if (user) {
        fetch('/api/user/me/wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wishlist: merged }),
        }).catch(() => {});
      }

      return merged;
    });
  }, [user]);

  return {
    wishlist,
    wishlistIds,
    isLoading,
    toggleWishlist,
    isInWishlist,
    mergeServerWishlist,
    clearWishlist,
  };
}
