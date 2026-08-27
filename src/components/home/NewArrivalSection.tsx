'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface NewArrivalSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  /** Pill next to the heading — pass `null` to hide (e.g. on the product page). */
  badge?: string | null;
}

export function NewArrivalSection({
  products,
  title = 'NEW ARRIVALS',
  subtitle = 'Discover our latest modest luxury Abayas, Kaftans & Hijabs',
  badge = 'Fresh Drop'
}: NewArrivalSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter or sort for new arrivals (newest items first)
  const newArrivalsList = products.length > 0 ? products : [];

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      updateScrollState();
    }
    return () => el?.removeEventListener('scroll', updateScrollState);
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-md relative overflow-hidden">

        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F2C76E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-[#F2C76E]/40 pb-3 sm:pb-4 relative z-10">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#9B050B] shrink-0" />
              <h2 className="font-extrabold text-[#9B050B] text-base sm:text-2xl tracking-wider uppercase font-serif leading-tight">
                {title}
              </h2>
              {badge && (
                <span className="px-2.5 py-0.5 bg-[#9B050B] text-white text-[9px] sm:text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 font-sans">{subtitle}</p>
          </div>

          {/* Controls: on mobile just the CTA (native swipe scrolls the rail);
              arrows join from sm up. */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full bg-white border border-[#F2C76E] text-[#9B050B] hover:bg-[#9B050B] hover:text-white transition-all shadow-sm items-center justify-center cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#9B050B] disabled:cursor-not-allowed active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full bg-white border border-[#F2C76E] text-[#9B050B] hover:bg-[#9B050B] hover:text-white transition-all shadow-sm items-center justify-center cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#9B050B] disabled:cursor-not-allowed active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/shop?sort=newest"
              className="flex-1 sm:flex-none min-h-[40px] sm:min-h-[44px] items-center justify-center px-5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] rounded-full text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 gap-1.5 cursor-pointer whitespace-nowrap inline-flex"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal Carousel Track with edge fade affordances */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory py-2 px-1 scroll-smooth"
          >
            {newArrivalsList.map((product) => (
              <div
                key={product?.id}
                className="snap-start flex-shrink-0 w-[58vw] max-w-[240px] sm:w-[250px] md:w-[270px] transform transition-transform duration-300 hover:-translate-y-1"
              >
                <ProductCard product={product} />
              </div>
            ))}

            {newArrivalsList.length === 0 && (
              <div className="w-full py-12 text-center text-stone-500 font-mono text-xs">
                No products found in new arrivals collection.
              </div>
            )}
          </div>

          {/* Fade hints that the rail keeps scrolling (matches card background) */}
          {canScrollLeft && (
            <div className="absolute left-0 top-2 bottom-2 w-8 sm:w-10 bg-gradient-to-r from-[#FFFBF0] to-transparent pointer-events-none z-[5]" aria-hidden="true" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-2 bottom-2 w-8 sm:w-10 bg-gradient-to-l from-[#FFFBF0] to-transparent pointer-events-none z-[5]" aria-hidden="true" />
          )}
        </div>

        {/* Swipe hint for touch users with more content off-screen */}
        {canScrollRight && newArrivalsList.length > 0 && (
          <p className="sm:hidden text-center text-[10px] font-bold uppercase tracking-widest text-stone-400 relative z-10">
            Swipe to explore →
          </p>
        )}
      </div>
    </section>
  );
}
