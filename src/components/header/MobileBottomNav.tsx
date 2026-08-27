'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, LayoutGrid, ShoppingBag, User, X, Sparkles, Clock, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'falak_recent_searches';
const MAX_RECENT_SEARCHES = 6;

/** Persisted recent search queries — newest first, capped, deduped. */
function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((q): q is string => typeof q === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches();
  const next = [trimmed, ...loadRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — recents are a bonus, never a blocker */
  }
  return next;
}

// Safe Image Component for search results
function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Derived-state adjustment during render — re-sync when the caller swaps
  // the image (no effect, so no cascading renders).
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgSrc(src);
    setHasError(false);
  }

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full bg-[#0C163A]/10 flex flex-col items-center justify-center p-1 text-center text-[#0C163A]">
        <Sparkles className="w-4 h-4 text-[#9B050B]" />
        <span className="text-[8px] font-bold mt-0.5 font-mono line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="60px"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setIsCartDrawerOpen, products: cartProducts } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Live catalog only — see the note in Header.tsx.
  const allStoreProducts = useMemo(() => cartProducts ?? [], [cartProducts]);

  // Read localStorage after mount — during render it would crash SSR.
  // Derived-state adjustment pattern keeps this effect-free.
  const [recentsLoaded, setRecentsLoaded] = useState(false);
  if (!recentsLoaded) {
    setRecentsLoaded(true);
    setRecentSearches(loadRecentSearches());
  }

  // Results are pure derived state — no effect needed.
  const searchResults = useMemo<Product[]>(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    return allStoreProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchMaterial = (p.material || '').toLowerCase().includes(q);
      const matchWork = (p.workType || '').toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchColor = p.colors?.some((c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q)));
      const matchVar = p.variations?.some((v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)) || (v.size && v.size.toLowerCase() === q));

      return matchName || matchCategory || matchMaterial || matchWork || matchCode || matchColor || matchVar;
    }).slice(0, 6);
  }, [searchQuery, allStoreProducts]);

  // While the fullscreen search sheet is open: lock background scroll and
  // let Escape (or the Android back gesture's popstate) close it.
  useEffect(() => {
    if (!isSearchOpen) return;

    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);

    // Push a history entry so the hardware/gesture back closes the sheet
    // instead of leaving the site.
    window.history.pushState({ falakSearchSheet: true }, '');
    const onPopState = () => setIsSearchOpen(false);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPopState);
      // If the sheet closed via Cancel/Escape (not the back gesture), our pushed
      // entry is still on top — consume it so the shopper's next back press
      // actually leaves instead of hitting a no-op. When closing via popstate or
      // in-app navigation the marker is already gone, so this is a no-op.
      if (window.history.state?.falakSearchSheet) {
        window.history.replaceState({}, '');
        window.history.back();
      }
    };
  }, [isSearchOpen]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Strip the search-sheet history marker before an in-app navigation so the
  // cleanup above doesn't pop the navigation we're about to push.
  const stripSheetHistoryMarker = () => {
    if (window.history.state?.falakSearchSheet) {
      window.history.replaceState({}, '');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setRecentSearches(saveRecentSearch(searchQuery));
      stripSheetHistoryMarker();
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleClearRecents = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch { /* ignore */ }
    setRecentSearches([]);
  };

  const getMatchedVariation = (product: Product, queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return null;

    const matchedColor = product.colors?.find((c) => {
      return c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q));
    });

    if (matchedColor) {
      let image = product.images?.[0];
      if (matchedColor.images && matchedColor.images.length > 0) {
        image = matchedColor.images[0];
      } else if (typeof matchedColor.imageIndex === 'number' && product.images?.[matchedColor.imageIndex]) {
        image = product.images[matchedColor.imageIndex];
      }
      return {
        colorName: matchedColor.name,
        hex: matchedColor.hex || '#000000',
        image: image || product.images?.[0],
      };
    }

    const matchedVar = product.variations?.find((v) => {
      return v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)) || (v.size && v.size.toLowerCase() === q);
    });

    if (matchedVar) {
      return {
        colorName: `${matchedVar.colorName}${matchedVar.size ? ` (${matchedVar.size})` : ''}`,
        hex: matchedVar.colorHex || '#000000',
        image: matchedVar.imageUrl || product.images?.[0],
      };
    }

    return null;
  };

  const navItems = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'search', label: 'Search', href: '#search', icon: Search, isSearchAction: true },
    { id: 'shop', label: 'Shop', href: '/shop', icon: LayoutGrid },
    { id: 'cart', label: 'Cart', href: '#cart', icon: ShoppingBag, isCartAction: true },
    { id: 'account', label: 'Account', href: '/account', icon: User }
  ];

  return (
    <>
      {/* Mobile Search Modal Sheet */}
      {isSearchOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#FFFBF0] animate-in fade-in slide-in-from-bottom duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#FFFBF0] border-b border-[#F2C76E]/60 flex items-center justify-between gap-3 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search abayas, hijabs, colors (emerald, black)..."
                aria-label="Search products"
                className="w-full min-h-[44px] pl-4 pr-10 py-2 bg-white border-2 border-[#9B050B] rounded-full text-xs text-[#0C163A] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-[#9B050B] hover:bg-[#F2C76E]/20 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="submit" aria-label="Submit search" className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#9B050B] cursor-pointer">
                  <Search className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              onClick={() => setIsSearchOpen(false)}
              className="min-h-[44px] px-2 text-stone-600 hover:text-[#9B050B] font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 divide-y divide-[#F2C76E]/25">
            {searchResults.length > 0 ? (
              searchResults.map((prod) => {
                const matchedVar = getMatchedVariation(prod, searchQuery);
                const displayImage = matchedVar?.image || prod.images?.[0] || '';

                return (
                  <Link
                    key={prod.id}
                    href={matchedVar?.colorName ? `/product/${prod.slug}?color=${encodeURIComponent(matchedVar.colorName)}` : `/product/${prod.slug}`}
                    onClick={() => {
                      setRecentSearches(saveRecentSearch(searchQuery));
                      stripSheetHistoryMarker();
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-xl hover:bg-[#F2C76E]/20 transition-colors group text-left active:scale-[0.98]"
                  >
                    <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#F2C76E]/50 shadow-xs">
                      <SafeImage src={displayImage} alt={prod.name} className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-serif font-bold text-xs text-[#0C163A] line-clamp-1">
                        {prod.name}
                      </p>

                      {matchedVar ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#9B050B]/10 border border-[#9B050B]/30 rounded-md text-[10px] font-bold text-[#9B050B]">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0 shadow-xs"
                            style={{ backgroundColor: matchedVar.hex }}
                          />
                          <span className="truncate">Variation: {matchedVar.colorName}</span>
                        </div>
                      ) : (
                        prod.colors && prod.colors.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5">
                            <span className="text-[9px] text-stone-500 font-bold">Colors:</span>
                            {prod.colors.slice(0, 5).map((c) => (
                              <span
                                key={c.name}
                                className="w-2.5 h-2.5 rounded-full border border-stone-300 shadow-xs shrink-0"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        )
                      )}

                      <p className="text-[10px] text-stone-500 font-mono">
                        {prod.category} {prod.code ? `• Code: ${prod.code}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-xs text-[#9B050B] font-mono block">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : searchQuery.trim() ? (
              <div className="py-12 text-center space-y-2">
                <Search className="w-6 h-6 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-700">
                  No matching products found
                </p>
                <p className="text-[11px] text-stone-500">
                  Try a color (emerald), fabric (georgette) or product code.
                </p>
              </div>
            ) : (
              <div className="space-y-5 pt-1">
                {/* Recent Searches — quick re-runs of what the shopper looked for */}
                {recentSearches.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-[#0C163A] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9B050B]" /> Recent Searches
                      </p>
                      <button
                        onClick={handleClearRecents}
                        className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-[#9B050B] transition-colors cursor-pointer min-h-[32px] px-1"
                        aria-label="Clear recent searches"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((q) => (
                        <button
                          key={q}
                          onClick={() => setSearchQuery(q)}
                          className="min-h-[36px] px-3.5 bg-white border border-[#9B050B]/25 hover:bg-[#9B050B]/5 text-[#0C163A] font-semibold text-xs rounded-full inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span className="max-w-[140px] truncate">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-[#0C163A] uppercase tracking-wider">Popular Searches</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Emerald Green', 'Black Abaya', 'Dusty Rose', 'Kaftan', 'Silk Hijab', 'Party Wear'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="min-h-[36px] px-3.5 bg-white border border-[#F2C76E]/60 hover:bg-[#F2C76E]/20 text-[#0C163A] font-medium rounded-full active:scale-95 transition-all cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {searchQuery && searchResults.length > 0 && (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full min-h-[52px] pb-[env(safe-area-inset-bottom)] bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>View all results for &quot;{searchQuery.trim()}&quot; ({searchResults.length} shown)</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      {/* Fixed Bottom Nav Bar — safe-area padded so the iOS home indicator
          never overlaps the tabs. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto select-none">
        <nav
          className="bg-[#FFFBF0]/98 backdrop-blur-2xl border-t-2 border-x-0 border-b-0 border-[#F2C76E]/90 rounded-t-2xl sm:rounded-t-3xl rounded-b-none shadow-[0_-10px_35px_rgba(12,22,58,0.14)] pt-1.5 px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              !item.isCartAction &&
              !item.isSearchAction &&
              (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));

            if (item.isSearchAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => setIsSearchOpen(true)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-haspopup="dialog"
                  aria-expanded={isSearchOpen}
                  className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 rounded-2xl transition-all duration-300 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#9B050B] cursor-pointer ${
                    isSearchOpen
                      ? 'text-[#9B050B] font-serif font-extrabold'
                      : 'text-[#0C163A]/70 hover:text-[#9B050B] font-medium'
                  }`}
                >
                  <Icon className={`w-[22px] h-[22px] transition-transform duration-300 ${isSearchOpen ? 'scale-110' : ''}`} strokeWidth={isSearchOpen ? 2.5 : 1.8} />
                  <span className="text-[10px] leading-tight mt-1 tracking-tight">Search</span>
                </button>
              );
            }

            if (item.isCartAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => setIsCartDrawerOpen(true)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ', empty'}`}
                  className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 rounded-2xl transition-all duration-300 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#9B050B] cursor-pointer text-[#0C163A]/70 hover:text-[#9B050B] font-medium"
                >
                  <div className="relative">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                    {cartCount > 0 && (
                      <span
                        key={cartCount}
                        className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-[#9B050B] text-[#FFFBF0] text-[9px] font-black font-mono rounded-full flex items-center justify-center shadow-md animate-fade-in"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight mt-1 tracking-tight">Cart</span>
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 rounded-2xl transition-all duration-300 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#9B050B] cursor-pointer ${
                  isActive
                    ? 'text-[#9B050B] font-serif font-extrabold'
                    : 'text-[#0C163A]/70 hover:text-[#9B050B] font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-b from-[#F2C76E]/40 to-[#9B050B]/10 border border-[#F2C76E]/70 rounded-2xl transition-all duration-300 -z-10 shadow-[0_2px_8px_rgba(155,5,11,0.08)]" aria-hidden="true" />
                )}

                <Icon
                  className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <span className="text-[10px] leading-tight mt-1 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
