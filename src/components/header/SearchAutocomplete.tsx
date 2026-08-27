'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Sparkles } from 'lucide-react';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useCart } from '@/context/CartContext';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackEvent } = useAnalytics();
  const { products } = useCart();

  useEffect(() => {
    if (query.trim().length >= 2) {
      const q = query.toLowerCase().trim();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.workType || '').toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q) ||
          p.colors?.some((c) => c.name.toLowerCase().includes(q)) ||
          p.variations?.some((v) => v.colorName.toLowerCase().includes(q))
      ).slice(0, 6);
      setResults(filtered);
      setIsOpen(true);

      trackEvent('search_query', { query: q, matchCount: filtered.length });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, products, trackEvent]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectProduct = (slug: string, colorName?: string) => {
    setIsOpen(false);
    setQuery('');
    if (colorName) {
      router.push(`/product/${slug}?color=${encodeURIComponent(colorName)}`);
    } else {
      router.push(`/product/${slug}`);
    }
  };

  // Helper to extract matched variation/color details for a product based on current query
  const getMatchedVariation = (product: Product, queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return null;

    // 1. Check colors array
    const matchedColor = product.colors?.find((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const hexMatch = c.hex && c.hex.toLowerCase().includes(q);
      return nameMatch || hexMatch;
    });

    if (matchedColor) {
      let image = product.images[0];
      if ((matchedColor as any).images && (matchedColor as any).images.length > 0) {
        image = (matchedColor as any).images[0];
      } else if (typeof matchedColor.imageIndex === 'number' && product.images[matchedColor.imageIndex]) {
        image = product.images[matchedColor.imageIndex];
      }
      return {
        colorName: matchedColor.name,
        hex: matchedColor.hex || '#000000',
        image,
      };
    }

    // 2. Check variations matrix array
    const matchedVar = product.variations?.find((v) => {
      const colorMatch = v.colorName.toLowerCase().includes(q);
      const hexMatch = v.colorHex && v.colorHex.toLowerCase().includes(q);
      const sizeMatch = v.size && v.size.toLowerCase() === q;
      return colorMatch || hexMatch || sizeMatch;
    });

    if (matchedVar) {
      return {
        colorName: `${matchedVar.colorName}${matchedVar.size ? ` (${matchedVar.size})` : ''}`,
        hex: matchedVar.colorHex || '#000000',
        image: matchedVar.imageUrl || product.images[0],
      };
    }

    return null;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search colors (emerald, crimson, black, gold), abayas, hijabs..."
          aria-label="Search products"
          className="w-full pl-9 pr-8 py-2 bg-stone-100 dark:bg-stone-800/80 border border-stone-300/60 dark:border-stone-700 rounded-full text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
        />
        <Search className="absolute left-3 w-4 h-4 text-stone-500 pointer-events-none" />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 p-0.5 text-stone-500 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase border-b border-stone-100 dark:border-stone-800 flex justify-between">
            <span>Product Suggestions</span>
            <span>{results.length} matches</span>
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500">
              No direct matches found for &quot;{query}&quot;. Press Enter to view all results.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {results.map((product) => {
                const matchedVar = getMatchedVariation(product, query);
                const displayImage = matchedVar?.image || product.images[0];

                return (
                  <button
                    key={product?.id}
                    onClick={() => handleSelectProduct(product?.slug, matchedVar?.colorName)}
                    className="w-full p-2.5 flex items-center gap-3 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 text-left transition-colors cursor-pointer group"
                  >
                    {/* Variation-Specific Thumbnail Image Preview */}
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200/60 shadow-xs">
                      <Image
                        src={displayImage}
                        alt={product?.name}
                        fill
                        sizes="50px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {product?.name}
                      </p>

                      {/* Matched Color Variation Badge Preview */}
                      {matchedVar ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300/50 rounded-md text-[10px] font-bold text-amber-900 dark:text-amber-200">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-400/50 shrink-0 shadow-xs"
                            style={{ backgroundColor: matchedVar.hex }}
                          />
                          <span className="truncate">Variation Preview: {matchedVar.colorName}</span>
                        </div>
                      ) : (
                        /* Available Color Swatches Preview */
                        product.colors && product.colors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-stone-500">Colors:</span>
                            {product.colors.slice(0, 5).map((c) => (
                              <span
                                key={c.name}
                                className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        )
                      )}

                      <p className="text-[11px] text-stone-500 dark:text-stone-500 flex items-center gap-2">
                        <span>{product?.category}</span>
                        <span>•</span>
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          {formatCurrency(product?.price)}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleSearchSubmit}
            className="w-full py-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 transition-colors border-t border-stone-100 dark:border-stone-800"
          >
            View all results for &quot;{query}&quot; →
          </button>
        </div>
      )}
    </div>
  );
}

