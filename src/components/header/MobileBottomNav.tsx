'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, LayoutGrid, ShoppingBag, User, X, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, Product } from '@/data/products';
import { formatCurrency } from '@/lib/utils';

// Safe Image Component for search results
function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

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
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const allStoreProducts = cartProducts && cartProducts.length > 0 ? cartProducts : PRODUCTS;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allStoreProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchMaterial = (p.material || '').toLowerCase().includes(q);
      const matchWork = (p.workType || '').toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchColor = p.colors?.some((c) => c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q)));
      const matchVar = p.variations?.some((v) => v.colorName.toLowerCase().includes(q) || (v.colorHex && v.colorHex.toLowerCase().includes(q)) || (v.size && v.size.toLowerCase() === q));

      return matchName || matchCategory || matchMaterial || matchWork || matchCode || matchColor || matchVar;
    }).slice(0, 6);

    setSearchResults(matches);
  }, [searchQuery, allStoreProducts]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const getMatchedVariation = (product: Product, queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return null;

    const matchedColor = product.colors?.find((c) => {
      return c.name.toLowerCase().includes(q) || (c.hex && c.hex.toLowerCase().includes(q));
    });

    if (matchedColor) {
      let image = product.images?.[0];
      if ((matchedColor as any).images && (matchedColor as any).images.length > 0) {
        image = (matchedColor as any).images[0];
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
      {/* Mobile Search Modal Drawer */}
      {isSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#FFFBF0] animate-in fade-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#FFFBF0] border-b border-[#F2C76E]/60 flex items-center justify-between gap-3 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search abayas, hijabs, colors (emerald, black)..."
                className="w-full pl-4 pr-9 py-2 bg-white border-2 border-[#9B050B] rounded-full text-xs text-[#0C163A] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B050B]/30"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-[#9B050B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B050B]">
                  <Search className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-stone-600 hover:text-[#9B050B] font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-[#F2C76E]/25">
            {searchResults.length > 0 ? (
              searchResults.map((prod) => {
                const matchedVar = getMatchedVariation(prod, searchQuery);
                const displayImage = matchedVar?.image || prod.images?.[0] || '';

                return (
                  <Link
                    key={prod.id}
                    href={matchedVar?.colorName ? `/product/${prod.slug}?color=${encodeURIComponent(matchedVar.colorName)}` : `/product/${prod.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 py-3 hover:bg-[#F2C76E]/20 transition-colors group text-left"
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
              <div className="py-12 text-center text-stone-500 text-xs">
                No matching products found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-xs font-bold text-[#0C163A] uppercase tracking-wider">Popular Searches</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Emerald Green', 'Black Abaya', 'Dusty Rose', 'Kaftan', 'Silk Hijab', 'Party Wear'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-3 py-1.5 bg-white border border-[#F2C76E]/60 hover:bg-[#F2C76E]/20 text-[#0C163A] font-medium rounded-full"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {searchQuery && searchResults.length > 0 && (
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full py-3 bg-[#9B050B] text-[#FFFBF0] font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>View All Results for &quot;{searchQuery}&quot;</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}

      {/* Fixed Bottom Nav Bar - Super Premium Luxury Design */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto select-none">
        <nav className="bg-[#FFFBF0]/98 backdrop-blur-2xl border-t-2 border-x-0 border-b-0 border-[#F2C76E]/90 rounded-t-2xl sm:rounded-t-3xl rounded-b-none shadow-[0_-10px_35px_rgba(12,22,58,0.14)] py-1.5 px-2 flex items-center justify-around">
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
                  className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-300 active:scale-95 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 cursor-pointer ${
                    isSearchOpen
                      ? 'text-[#9B050B] font-extrabold font-serif'
                      : 'text-[#0C163A]/70 hover:text-[#9B050B] font-medium'
                  }`}
                >
                  {isSearchOpen && (
                    <span className="absolute inset-0 bg-gradient-to-b from-[#F2C76E]/40 to-[#9B050B]/10 border border-[#F2C76E]/70 rounded-2xl transition-all duration-300 -z-10 shadow-[0_2px_8px_rgba(155,5,11,0.08)]" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isSearchOpen ? 'stroke-[2.5] scale-110 text-[#9B050B]' : 'stroke-[1.8]'}`} />
                  <span className="text-[10px] leading-tight mt-1 tracking-tight">Search</span>
                  {isSearchOpen && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B050B] shadow-[0_0_6px_#9B050B] mt-0.5 animate-pulse" />
                  )}
                </button>
              );
            }

            if (item.isCartAction) {
              const isCartActive = pathname === '/cart';
              return (
                <Link
                  key={item.id}
                  href="/cart"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-300 active:scale-95 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 cursor-pointer ${
                    isCartActive
                      ? 'text-[#9B050B] font-extrabold font-serif'
                      : 'text-[#0C163A]/70 hover:text-[#9B050B] font-medium'
                  }`}
                >
                  {isCartActive && (
                    <span className="absolute inset-0 bg-gradient-to-b from-[#F2C76E]/40 to-[#9B050B]/10 border border-[#F2C76E]/70 rounded-2xl transition-all duration-300 -z-10 shadow-[0_2px_8px_rgba(155,5,11,0.08)]" />
                  )}
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isCartActive
                          ? 'stroke-[2.5] scale-110 text-[#9B050B]'
                          : 'stroke-[1.8]'
                      }`}
                    />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[#9B050B] text-[#FFFBF0] text-[9px] font-black font-mono rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight mt-1 tracking-tight">Cart</span>
                  {isCartActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B050B] shadow-[0_0_6px_#9B050B] mt-0.5 animate-pulse" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-300 active:scale-95 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 cursor-pointer ${
                  isActive
                    ? 'text-[#9B050B] font-extrabold font-serif'
                    : 'text-[#0C163A]/70 hover:text-[#9B050B] font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-b from-[#F2C76E]/40 to-[#9B050B]/10 border border-[#F2C76E]/70 rounded-2xl transition-all duration-300 -z-10 shadow-[0_2px_8px_rgba(155,5,11,0.08)]" />
                )}

                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive
                      ? 'stroke-[2.5] scale-110 text-[#9B050B]'
                      : 'stroke-[1.8]'
                  }`}
                />

                <span className="text-[10px] leading-tight mt-1 tracking-tight">
                  {item.label}
                </span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9B050B] shadow-[0_0_6px_#9B050B] mt-0.5 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
