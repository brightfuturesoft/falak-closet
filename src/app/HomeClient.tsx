'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryFilterSlider } from '@/components/home/CategoryFilterSlider';
import { NewArrivalSection } from '@/components/home/NewArrivalSection';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { PromoBannerSection } from '@/components/home/PromoBannerSection';
import { AllProductsSection } from '@/components/home/AllProductsSection';
import { ValuePropsSection } from '@/components/home/ValuePropsSection';
import type { HeroSlideView } from '@/lib/heroSlides';

/**
 * The interactive half of the home page — everything that needs `useCart` or
 * local state. The hero slides arrive as a prop from the server component so
 * they render in the initial HTML instead of after a client fetch.
 */
export default function HomeClient({ heroSlides }: { heroSlides: HeroSlideView[] }) {
  const { products, isLoadingProducts, productsError, refreshProductsFromApi } = useCart();
  const [selectedFilter, setSelectedFilter] = useState<{ type: string; val: string } | null>(null);

  // Filter products dynamically when user clicks a category tag
  const filteredProducts = selectedFilter
    ? products.filter((p) => {
        if (selectedFilter.type === 'occasion') return p.occasion === selectedFilter.val;
        if (selectedFilter.type === 'weather') return p.weather === selectedFilter.val;
        if (selectedFilter.type === 'material') return p.material === selectedFilter.val;
        if (selectedFilter.type === 'category') return p.category === selectedFilter.val;
        if (selectedFilter.type === 'subCategory') return p.subCategory === selectedFilter.val;
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
    <div className="pb-20 lg:pb-16 space-y-6 sm:space-y-10">
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Indicator Banner */}
      {selectedFilter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between bg-[#9B050B]/10 border border-[#9B050B]/30 rounded-2xl px-5 py-2.5 text-xs text-stone-800">
            <span>
              Filtering by <strong>{selectedFilter.type}</strong>:{' '}
              <span className="text-[#9B050B] font-bold">{selectedFilter.val}</span>
              <span className="text-stone-500"> · {filteredProducts.length} found</span>
            </span>
            <button
              onClick={() => setSelectedFilter(null)}
              className="text-[#9B050B] font-bold hover:underline cursor-pointer"
            >
              Clear Filter ✕
            </button>
          </div>
        </div>
      )}

      {isBusy ? (
        /* Skeleton stands in for the three product rows below. */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className="space-y-4">
              <div className="h-5 w-64 bg-stone-200 rounded-full animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="aspect-[3/4] bg-stone-200 rounded-2xl" />
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
          <div className="py-16 text-center bg-white rounded-3xl border border-pink-100 px-8 space-y-3 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900">Our new collection is on its way</h2>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No designs have been published yet. Follow us for the launch announcement.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 3. NEW ARRIVALS Section */}
          <NewArrivalSection products={filteredProducts} />

          {/* 4. BEST SELLERS & TRENDING CHOICE Section */}
          <BestSellersSection products={products} />

          {/* 5. FLASH SALE & PROMOTIONAL VOUCHERS Banner */}
          <PromoBannerSection />

          {/* 6. ALL PRODUCTS & FULL COLLECTION Section */}
          <AllProductsSection products={filteredProducts} />
        </>
      )}

      {/* 7. WHY CHOOSE FALAK CLOSET Value Showcase */}
      <ValuePropsSection />
    </div>
  );
}
