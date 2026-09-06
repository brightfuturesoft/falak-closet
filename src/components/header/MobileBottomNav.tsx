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
      <div className="w-full h-full bg-[#0D153A]/10 flex flex-col items-center justify-center p-1 text-center text-[#0D153A]">
        <Sparkles className="w-4 h-4 text-[#A80C14]" />
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
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

  // Listen for global open-mobile-search event from header search icon
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-mobile-search', handleOpenSearch);
    return () => window.removeEventListener('open-mobile-search', handleOpenSearch);
  }, []);

  // Read localStorage after mount — during the hydration render it would make
  // the client output diverge from the server HTML (React error #418).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of persisted recents; the sheet is closed at mount so this can't cascade visibly
    setRecentSearches(loadRecentSearches());
  }, []);

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

  // Close the search modal when the pathname changes (e.g. user clicks nav items)
  useEffect(() => {
    setIsSearchOpen(false);
  }, [pathname]);

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
    { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/8801799775487?text=Hello%2C%20I%20have%20a%20question%20about%20Falak%20Closet', icon: WhatsAppIcon, isExternal: true },
    { id: 'shop', label: 'Shop', href: '/shop', icon: LayoutGrid },
    { id: 'cart', label: 'Cart', href: '/cart', icon: ShoppingBag },
    { id: 'account', label: 'Account', href: '/account', icon: User }
  ];

  return (
    <>
      {/* Mobile Search Modal Sheet */}
      {isSearchOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in slide-in-from-bottom duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-[#F8D2D5]/60 flex items-center justify-between gap-3 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search abayas, hijabs, colors (emerald, black)..."
                aria-label="Search products"
                className="w-full min-h-[44px] pl-4 pr-10 py-2 bg-white border border-[#F8D2D5] rounded-full text-xs text-[#0D153A] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A80C14]/30"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-[#A80C14] hover:bg-[#FDF2F3] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="submit" aria-label="Submit search" className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#A80C14] cursor-pointer">
                  <Search className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              onClick={() => setIsSearchOpen(false)}
              className="min-h-[44px] px-2 text-stone-600 hover:text-[#A80C14] font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 divide-y divide-[#F8D2D5]/40">
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
                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-xl hover:bg-[#FDF2F3] transition-colors group text-left active:scale-[0.98]"
                  >
                    <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-[#F8D2D5] shadow-xs">
                      <SafeImage src={displayImage} alt={prod.name} className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-serif font-bold text-xs text-[#0D153A] line-clamp-1">
                        {prod.name}
                      </p>

                      {matchedVar ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#A80C14]/10 border border-[#A80C14]/30 rounded-md text-[10px] font-bold text-[#A80C14]">
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
                      <span className="font-extrabold text-xs text-[#A80C14] font-mono block">
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
                      <p className="text-[11px] font-bold text-[#0D153A] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A80C14]" /> Recent Searches
                      </p>
                      <button
                        onClick={handleClearRecents}
                        className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-[#A80C14] transition-colors cursor-pointer min-h-[32px] px-1"
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
                          className="min-h-[36px] px-3.5 bg-white border border-[#F8D2D5] hover:bg-[#FDF2F3] text-[#0D153A] font-semibold text-xs rounded-full inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span className="max-w-[140px] truncate">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-[#0D153A] uppercase tracking-wider">Popular Searches</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Emerald Green', 'Black Abaya', 'Dusty Rose', 'Kaftan', 'Silk Hijab', 'Party Wear'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="min-h-[36px] px-3.5 bg-white border border-[#F8D2D5]/60 hover:bg-[#FDF2F3] text-[#0D153A] font-medium rounded-full active:scale-95 transition-all cursor-pointer"
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
              className="w-full min-h-[52px] pb-[env(safe-area-inset-bottom)] bg-[#A80C14] hover:bg-[#8C0A10] text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer"
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
          className="bg-white/95 backdrop-blur-2xl border-t border-[#F8D2D5]/80 rounded-t-3xl rounded-b-none shadow-[0_-10px_30px_rgba(168,12,20,0.06)] pt-2 px-2 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            if (item.isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Contact us on WhatsApp"
                  className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 transition-all duration-300 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] text-[#25D366] font-medium hover:font-bold cursor-pointer"
                >
                  <Icon className="w-[22px] h-[22px] transition-transform duration-300 hover:scale-110" />
                  <span className="text-[10px] leading-tight mt-1 tracking-tight text-[#25D366] font-bold">WhatsApp</span>
                </a>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1.5 transition-all duration-300 active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-[#A80C14] cursor-pointer ${isActive
                  ? 'text-[#A80C14] font-sans font-extrabold'
                  : 'text-[#0D153A]/70 hover:text-[#A80C14] font-medium'
                  }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-[#FDF2F3] border border-[#F8D2D5]/65 rounded transition-all duration-300 -z-10 shadow-xs" aria-hidden="true" />
                )}

                <div className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {item.id === 'cart' && cartCount > 0 && (
                    <span
                      key={cartCount}
                      className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-[#A80C14] text-white text-[9px] font-black font-mono rounded-full flex items-center justify-center shadow-md animate-fade-in"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

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
