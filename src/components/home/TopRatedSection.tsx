'use client';

import React from 'react';
import Link from 'next/link';
import { MoveRight } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';

interface TopRatedSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  place?: 'product_details' | 'home';
}

export function TopRatedSection({
  products,
  title = 'TOP RATED PRODUCTS',
  subtitle = 'Customer favorites with our highest ratings and reviews',
  place = 'home'
}: TopRatedSectionProps) {
  // Sort products by rating descending, then review count descending
  const sortedProducts = [...products].sort((a, b) => {
    const rA = a.rating ?? 0;
    const rB = b.rating ?? 0;
    if (rB !== rA) return rB - rA;
    return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  });

  const displayProducts = sortedProducts.slice(0, 10);

  return (
    <section className={cn('max-w-7xl mx-auto w-full', place === 'product_details' ? 'p-0 sm:p-0 lg:px-0' : 'px-4 sm:px-6 lg:px-8')}>
      <div className={cn("bg-transparent sm:bg-white border-none sm:border sm:border-[#F8D2D5]/90 rounded-none sm:rounded-3xl p-0 sm:p-6 lg:p-7 space-y-3.5 sm:space-y-6 shadow-none sm:shadow-xs relative overflow-hidden", place === 'product_details' && 'p-0 border-none shadow-none rounded-none')}>
        {/* Section Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-[#F8D2D5]/60 pb-2.5 sm:pb-4 relative z-10">
          <div className="space-y-0.5 flex-1 min-w-0 pr-2">
            <h2 className={cn("font-sans font-black text-[#0D153A] text-sm sm:text-base md:text-lg tracking-wider uppercase leading-tight truncate sm:whitespace-normal", place === 'product_details' ? "text-base sm:text-lg" : '')}>
              {title}
            </h2>
            <p className={cn("text-[11px] sm:text-xs text-stone-500 font-sans line-clamp-1 sm:line-clamp-none", place === 'product_details' && 'text-[11px] sm:text-xs')}>{subtitle}</p>
          </div>

          <Link
            href="/shop?sort=rating"
            className={cn("inline-flex min-h-[34px] sm:min-h-[40px] items-center justify-center px-3.5 sm:px-4 bg-[#A80C14] hover:bg-[#8C0A10] text-white rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0", place === 'product_details' && 'text-xs px-0')}
          >
            {place === 'product_details' ? <MoveRight size={20} aria-label='see more' /> : 'See More'}
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="relative z-10">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product?.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="w-full py-12 text-center text-stone-400 font-mono text-xs">
              No top rated products found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
