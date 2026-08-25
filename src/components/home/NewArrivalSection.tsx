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
}

export function NewArrivalSection({
  products,
  title = 'NEW ARRIVALS',
  subtitle = 'Discover our latest modest luxury Abayas, Kaftans & Hijabs'
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
      el.addEventListener('scroll', updateScrollState);
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-14">
      <div className="bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-3xl p-5 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
        
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F2C76E]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F2C76E]/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9B050B] animate-pulse" />
              <h2 className="font-extrabold text-[#9B050B] text-lg sm:text-2xl tracking-wider uppercase font-serif">
                {title}
              </h2>
              <span className="px-2.5 py-0.5 bg-[#9B050B] text-white text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
                Fresh Drop 2026
              </span>
            </div>
            <p className="text-xs text-stone-600 font-sans">{subtitle}</p>
          </div>

          {/* Controls: Navigation Arrow Buttons & View All Link */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full bg-white border border-[#F2C76E] text-[#9B050B] hover:bg-[#9B050B] hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#9B050B] disabled:cursor-not-allowed"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full bg-white border border-[#F2C76E] text-[#9B050B] hover:bg-[#9B050B] hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#9B050B] disabled:cursor-not-allowed"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/shop?sort=newest"
              className="px-5 py-2.5 bg-[#9B050B] hover:bg-[#B8000A] text-[#FFFBF0] rounded-full text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 px-1 scroll-smooth"
        >
          {newArrivalsList.map((product) => (
            <div
              key={product?.id}
              className="snap-start flex-shrink-0 w-[220px] sm:w-[250px] md:w-[270px] transform transition-transform hover:-translate-y-1"
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
      </div>
    </section>
  );
}
