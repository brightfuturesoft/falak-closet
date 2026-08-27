'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, SlidersHorizontal, ArrowRight, Search, X } from 'lucide-react';
import { Product } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';

interface AllProductsSectionProps {
  products: Product[];
}

export function AllProductsSection({ products }: AllProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'rating'>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    'All',
    'Abayas',
    'Hijabs & Dupattas',
    'Modest Dresses',
    'Co-ord Sets',
    'Luxury Tunics',
    'Accessories'
  ];

  // Filter products by selected category and search query
  let filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.material.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCat && matchesSearch;
  });

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
  });

  const hasActiveFilters = selectedCategory !== 'All' || searchTerm.trim() !== '';

  const handleReset = () => {
    setSelectedCategory('All');
    setSearchTerm('');
  };

  return (
    <section id="all-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-white border border-stone-200/70 rounded-3xl p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-xs">
        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4 border-b border-stone-100 pb-3 sm:pb-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D92670]/10 border border-[#D92670]/20 rounded-full text-[10px] sm:text-xs text-[#D92670] font-bold uppercase tracking-wider">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full Store Catalog</span>
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-extrabold text-[#0C163A] leading-tight mt-1.5">
              ALL PRODUCTS &amp; MODEST COLLECTION
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
              Browse our complete catalog of handcrafted abayas, premium hijabs, co-ord sets, and accessories.
            </p>
          </div>

          {/* Search & Sort Controls — full width and stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-52">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search collection..."
                aria-label="Search the collection"
                className="w-full min-h-[42px] pl-9 pr-9 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D92670] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-stone-500 hover:text-[#D92670] hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 min-h-[42px] bg-stone-50 border border-stone-200 rounded-xl px-3 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort products"
                className="bg-transparent text-stone-800 font-bold focus:outline-none cursor-pointer py-2 w-full sm:w-auto"
              >
                <option value="newest">Featured &amp; Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs — swipeable pill rail on mobile */}
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x pb-0.5 -mx-1 px-1"
          role="tablist"
          aria-label="Product categories"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`snap-start shrink-0 min-h-[38px] px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 inline-flex items-center ${selectedCategory === cat
                  ? 'bg-[#D92670] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-pink-100 hover:text-[#D92670]'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result Summary Bar with removable filter chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-stone-500">
          <span>
            Showing <strong className="text-stone-800">{filtered.length}</strong> of{' '}
            <strong className="text-stone-800">{products.length}</strong> Products
          </span>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="inline-flex items-center gap-1 min-h-[30px] px-2.5 bg-pink-50 border border-pink-200 text-[#D92670] rounded-full font-bold hover:bg-pink-100 transition-colors cursor-pointer"
                >
                  {selectedCategory}
                  <X className="w-3 h-3" />
                </button>
              )}
              {searchTerm.trim() && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1 min-h-[30px] px-2.5 bg-pink-50 border border-pink-200 text-[#D92670] rounded-full font-bold hover:bg-pink-100 transition-colors cursor-pointer max-w-[160px]"
                >
                  <span className="truncate">&ldquo;{searchTerm.trim()}&rdquo;</span>
                  <X className="w-3 h-3 shrink-0" />
                </button>
              )}
              <button
                onClick={handleReset}
                className="text-[#D92670] font-bold hover:underline cursor-pointer ml-1"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => (
              <ProductCard key={product?.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200 px-4">
            <Search className="w-6 h-6 text-stone-300 mx-auto" />
            <p className="text-stone-500 text-xs sm:text-sm">
              No products found matching {hasActiveFilters ? 'your active filters' : 'this view'}.
            </p>
            <button
              onClick={handleReset}
              className="inline-flex min-h-[40px] items-center px-5 bg-[#D92670] text-white font-bold text-xs rounded-xl hover:bg-[#C2185B] transition-colors cursor-pointer active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom Catalog Link Banner */}
        <div className="pt-4 text-center border-t border-stone-100">
          <Link
            href="/shop"
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 px-8 bg-[#0C163A] hover:bg-[#122050] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Explore Entire Storefront Catalog</span>
            <ArrowRight className="w-4 h-4 text-[#F2C76E]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
