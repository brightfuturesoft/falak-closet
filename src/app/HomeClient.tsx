'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryFilterSlider } from '@/components/home/CategoryFilterSlider';
import { NewArrivalSection } from '@/components/home/NewArrivalSection';
import { TopRatedSection } from '@/components/home/TopRatedSection';
// import { LatestProductsSection } from '@/components/home/LatestProductsSection';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import type { HeroSlideView } from '@/lib/heroSlides';
// import { PromotionBanner } from '@prisma/client';
// import { ValuePropItem } from '@/lib/siteSettings';

import { taxonomyMatches } from '@/lib/utils';

/**
 * The interactive half of the home page — everything that needs `useCart` or
 * local state. The hero slides arrive as a prop from the server component so
 * they render in the initial HTML instead of after a client fetch.
 */
export default function HomeClient({
  heroSlides
}: {
  heroSlides: HeroSlideView[];
}) {
  const { products, isLoadingProducts, productsError, refreshProductsFromApi } = useCart();
  const [selectedFilter, setSelectedFilter] = useState<{ type: string; val: string } | null>(null);

  // Filter products dynamically when user clicks a category tag
  const filteredProducts = selectedFilter
    ? products.filter((p) => {
      if (selectedFilter.type === 'occasion') return taxonomyMatches(p.occasion, selectedFilter.val);
      if (selectedFilter.type === 'weather') return taxonomyMatches(p.weather, selectedFilter.val);
      if (selectedFilter.type === 'material') return taxonomyMatches(p.material, selectedFilter.val);
      if (selectedFilter.type === 'category') return taxonomyMatches(p.category, selectedFilter.val);
      if (selectedFilter.type === 'subCategory') return taxonomyMatches(p.subCategory, selectedFilter.val);
      return true;
    })
    : products;

  const handleSelectFilter = (type: string, value: string) => {
    if (selectedFilter?.type === type && selectedFilter?.val === value) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter({ type, val: value });
    }
  };

  const isEmptyCatalog = products.length === 0;
  const isBusy = isLoadingProducts && isEmptyCatalog;

  return (
    // Vertical rhythm comes from THIS space-y only — the sections themselves
    // carry no outer margins, so gaps can never double up.
    <div className="pb-24 lg:pb-16 space-y-5 sm:space-y-8 lg:space-y-12">
      {/* 1. Hero Banner Slider — slides fetched server-side, passed down as a prop */}
      <HeroCarousel slides={heroSlides} />

      {/* 2. Shop By Category / Occasion / Weather / Material Interactive Slider */}
      <CategoryFilterSlider onSelectFilter={handleSelectFilter} activeFilter={selectedFilter} />

      {/* Catalog read failed — the hero and promos still render, but say plainly
          that the product rows are missing rather than showing nothing. */}
      {productsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800">
            <p className="text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Our collection could not be loaded{isEmptyCatalog ? '' : ' — showing the last known products'}.
            </p>
            <button
              onClick={() => refreshProductsFromApi()}
              className="inline-flex min-h-[40px] items-center justify-center px-4 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer gap-1.5 shrink-0 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Indicator Banner */}
      {selectedFilter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 bg-[#FDF2F3] border border-[#F8D2D5] rounded-2xl px-4 py-2.5 text-xs text-stone-800">
            <span className="min-w-0">
              <span className="hidden sm:inline">Filtering by{' '}</span>
              <strong className="capitalize">{selectedFilter.type}</strong>:{' '}
              <span className="text-[#A80C14] font-bold">{selectedFilter.val}</span>
              <span className="text-stone-500"> · {filteredProducts.length} found</span>
            </span>
            <button
              onClick={() => setSelectedFilter(null)}
              className="inline-flex shrink-0 items-center gap-1 min-h-[32px] px-3 rounded-full bg-[#A80C14] text-white font-bold text-[11px] hover:bg-[#8C0A10] transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}

      {isBusy ? (
        /* Skeleton stands in for the product rows below — same column
           counts as the real grids so nothing shifts when data lands. */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className="space-y-4">
              <div className="h-5 w-64 bg-stone-200 rounded-full animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[4/5] bg-stone-200 rounded-2xl" />
                    <div className="h-3 bg-stone-200 rounded-full w-3/4" />
                    <div className="h-3 bg-stone-200 rounded-full w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isEmptyCatalog && !productsError ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 text-center bg-white rounded-3xl border border-[#F8D2D5] px-8 space-y-3 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">Our new collection is on its way</h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              No designs have been published yet. Follow us for the launch announcement.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 3. NEW ARRIVALS Section */}
          <NewArrivalSection place="home" products={filteredProducts} />

          {/* 4. TOP RATED Section */}
          <TopRatedSection place="home" products={filteredProducts} />

          {/* 5. BEST SELLERS Section */}
          <BestSellersSection products={products} />

          {/* 6. LATEST PRODUCTS Section */}
          {/* <LatestProductsSection products={filteredProducts} /> */}
        </>
      )}
    </div>
  );
}
