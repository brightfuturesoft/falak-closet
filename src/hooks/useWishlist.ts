'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '@/data/products';

export function useWishlist(products: Product[]) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial wishlist from localStorage (guest fallback)
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
          Promise.resolve().then(() => {
            setWishlistIds(ids);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load local wishlist:', err);
    } finally {
      Promise.resolve().then(() => {
        setIsLoading(false);
      });
    }
  }, []);

  // Sync wishlistIds to localStorage
  useEffect(() => {
    if (products.length === 0) return;
    // We resolve the actual products for localStorage backward-compatibility
    const resolved = wishlistIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    localStorage.setItem('falak_wishlist', JSON.stringify(resolved));
  }, [wishlistIds, products]);

  // Resolve product IDs to full Product objects
  const wishlist = useMemo(() => {
    return wishlistIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [wishlistIds, products]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const targetId = product.id;
    setWishlistIds((prev) => {
      const exists = prev.includes(targetId);
      return exists ? prev.filter((id) => id !== targetId) : [...prev, targetId];
    });

    // Optimistically push update to server if authenticated
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
  }, []);

  const mergeServerWishlist = useCallback((serverIds: string[]) => {
    // Overwrite/merge the wishlist on the client
    setWishlistIds((prev) => {
      const merged = Array.from(new Set([...prev, ...serverIds]));

      // Also push the merged list back to server to synchronize
      fetch('/api/user/me/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist: merged }),
      }).catch(() => {});

      return merged;
    });
  }, []);

  return {
    wishlist,
    wishlistIds,
    isLoading,
    toggleWishlist,
    isInWishlist,
    mergeServerWishlist,
  };
}
