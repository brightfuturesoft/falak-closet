'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface LatestProductsSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export function LatestProductsSection({
  products,
  title = 'LATEST PRODUCTS',
  subtitle = 'Discover our recently added modest styles'
}: LatestProductsSectionProps) {
  // Take the first 3 products for this compact display
  const latestList = products.slice(0, 5);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-white border border-[#F8D2D5] rounded-3xl p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-xs relative overflow-hidden">
        {/* Section Header Row */}
        <div className="flex items-center justify-between border-b border-[#F8D2D5]/60 pb-3 sm:pb-4 relative z-10">
          <div className="space-y-0.5 w-[70%]">
            <h2 className="font-sans font-black text-[#0D153A] text-base sm:text-lg tracking-wider uppercase leading-tight">
              {title}
            </h2>
            <p className="text-[11px] truncate sm:text-xs text-stone-500 font-sans">{subtitle}</p>
          </div>

          <Link
            href="/shop?sort=newest"
            className="inline-flex min-h-[36px] sm:min-h-[40px] items-center justify-center px-4 bg-[#A80C14] hover:bg-[#8C0A10] text-white rounded-md text-xs font-bold transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            See More
          </Link>
        </div>

        {/* Product Cards Grid (3 columns on desktop, 2 on mobile) */}
        <div className="relative z-10">
          {latestList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-6">
              {latestList.map((product) => (
                <ProductCard key={product?.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="w-full py-12 text-center text-stone-400 font-mono text-xs">
              No products found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
